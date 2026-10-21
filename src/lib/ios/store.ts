'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppId, LaunchRect, NotifItem, ThemeMode, WallpaperId } from './types'

export const DEFAULT_PAGES: AppId[][] = [['weather', 'calendar'], []]
export const DEFAULT_DOCK: AppId[] = ['music', 'photos', 'notes', 'settings']
export const ALL_APPS: AppId[] = ['weather', 'music', 'photos', 'notes', 'calendar', 'settings']

interface OSState {
  /* ---- layout (persisted) ---- */
  pages: AppId[][]
  dock: AppId[]
  /** apps removed from home; they still live in the App Library page */
  hidden: AppId[]

  /* ---- navigation (transient) ---- */
  page: number
  wiggle: boolean
  openApp: AppId | null
  launchRect: LaunchRect | null
  notifOpen: boolean
  controlOpen: boolean
  lowPower: boolean

  /* ---- system settings (persisted) ---- */
  theme: ThemeMode
  wallpaper: WallpaperId
  brightness: number
  volume: number
  wifi: boolean
  bluetooth: boolean
  airplane: boolean
  flashlight: boolean
  rotationLock: boolean
  battery: number

  /* ---- notifications (transient) ---- */
  notifs: NotifItem[]

  /* ---- actions ---- */
  setPage: (p: number) => void
  setWiggle: (v: boolean) => void
  launch: (app: AppId, rect?: LaunchRect | null) => void
  closeApp: () => void
  setNotifOpen: (v: boolean) => void
  setControlOpen: (v: boolean) => void
  clearNotifs: () => void
  dismissNotif: (id: string) => void

  setTheme: (t: ThemeMode) => void
  setWallpaper: (w: WallpaperId) => void
  setBrightness: (v: number) => void
  setVolume: (v: number) => void
  setWifi: (v: boolean) => void
  setBluetooth: (v: boolean) => void
  setAirplane: (v: boolean) => void
  setFlashlight: (v: boolean) => void
  setRotationLock: (v: boolean) => void
  setLowPower: (v: boolean) => void
  tickBattery: () => void

  /** Swap the item at location A with the item at location B. */
  swapSlots: (a: SlotRef, b: SlotRef) => void
  /** Move an app to the end of a page (or the dock) — used when dragging across pages. */
  moveAppToEnd: (app: AppId, dest: number | 'dock') => void
  /** Re-add a removed app to the first home page (from App Library). */
  restoreApp: (app: AppId) => void
  removeFromHome: (app: AppId) => void
  resetLayout: () => void
}

export interface SlotRef {
  kind: 'page' | 'dock'
  page?: number
  index: number
}

function listFor(state: Pick<OSState, 'pages' | 'dock'>, slot: SlotRef): AppId[] | null {
  if (slot.kind === 'dock') return state.dock
  const p = state.pages[slot.page ?? -1]
  return p ? [...p] : null
}

export const useOS = create<OSState>()(
  persist(
    (set, get) => ({
      pages: DEFAULT_PAGES,
      dock: DEFAULT_DOCK,
      hidden: [],

      page: 0,
      wiggle: false,
      openApp: null,
      launchRect: null,
      notifOpen: false,
      controlOpen: false,
      lowPower: false,

      theme: 'light',
      wallpaper: 'light',
      brightness: 92,
      volume: 65,
      wifi: true,
      bluetooth: true,
      airplane: false,
      flashlight: false,
      rotationLock: false,
      battery: 84,

      notifs: [
        {
          id: 'n-weather',
          app: 'weather',
          title: 'Cupertino Weather',
          body: 'Light rain expected around 6:00 PM. Umbrella might be a good idea.',
          time: 'now',
        },
        {
          id: 'n-calendar',
          app: 'calendar',
          title: 'Design Review',
          body: 'Starts in 30 minutes · Conference Room 2',
          time: '9m ago',
        },
        {
          id: 'n-messages',
          app: 'notes',
          title: 'Notes',
          body: 'Grocery list synced from your other device.',
          time: '32m ago',
        },
        {
          id: 'n-os',
          app: 'settings',
          title: 'iOS Web 17.2',
          body: 'Home screen tips: long-press an icon to rearrange, pull down for notifications, pull up for Control Center.',
          time: '1h ago',
        },
      ],

      setPage: (p) => set({ page: p }),
      setWiggle: (v) => set({ wiggle: v }),
      launch: (app, rect) =>
        set({ openApp: app, launchRect: rect ?? null, notifOpen: false, controlOpen: false, wiggle: false }),
      closeApp: () => set({ openApp: null, launchRect: null }),
      setNotifOpen: (v) => set({ notifOpen: v, controlOpen: false }),
      setControlOpen: (v) => set({ controlOpen: v, notifOpen: false }),
      clearNotifs: () => set({ notifs: [] }),
      dismissNotif: (id) => set((s) => ({ notifs: s.notifs.filter((n) => n.id !== id) })),

      setTheme: (t) => set({ theme: t }),
      setWallpaper: (w) => set({ wallpaper: w }),
      setBrightness: (v) => set({ brightness: Math.min(100, Math.max(10, Math.round(v))) }),
      setVolume: (v) => set({ volume: Math.min(100, Math.max(0, Math.round(v))) }),
      setWifi: (v) => set({ wifi: v }),
      setBluetooth: (v) => set({ bluetooth: v }),
      setAirplane: (v) => set({ airplane: v }),
      setFlashlight: (v) => set({ flashlight: v }),
      setRotationLock: (v) => set({ rotationLock: v }),
      setLowPower: (v) => set({ lowPower: v }),
      tickBattery: () => set((s) => ({ battery: Math.max(5, s.battery - 1) })),

      swapSlots: (a, b) => {
        const s = get()
        const la = listFor(s, a)
        const lb = listFor(s, b)
        if (!la || !lb) return
        const itemA = la[a.index]
        const itemB = lb[b.index]
        if (!itemA || !itemB || itemA === itemB) return
        const pages = s.pages.map((p) => [...p])
        const dock = [...s.dock]
        const put = (slot: SlotRef, item: AppId) => {
          if (slot.kind === 'dock') dock[slot.index] = item
          else if (pages[slot.page ?? 0]) pages[slot.page ?? 0][slot.index] = item
        }
        put(a, itemB)
        put(b, itemA)
        // de-duplicate: an app may only appear once across home + dock
        const seen = new Set<AppId>()
        const cleanPages = pages.map((p) =>
          p.filter((app) => {
            if (seen.has(app)) return false
            seen.add(app)
            return true
          }),
        )
        set({ pages: cleanPages, dock })
      },

      moveAppToEnd: (app, dest) => {
        const s = get()
        const pages = s.pages.map((p) => p.filter((a) => a !== app))
        const dock = s.dock.filter((a) => a !== app)
        if (dest === 'dock') dock.push(app)
        else if (pages[dest]) pages[dest].push(app)
        else pages[pages.length - 1]?.push(app)
        set({ pages, dock })
      },

      restoreApp: (app) => {
        const s = get()
        const alreadyHome = s.pages.some((p) => p.includes(app)) || s.dock.includes(app)
        if (alreadyHome) {
          set({ hidden: s.hidden.filter((a) => a !== app) })
          return
        }
        const pages = s.pages.map((p) => [...p])
        const target = pages[0] ?? []
        target.push(app)
        pages[0] = target
        set({ pages, hidden: s.hidden.filter((a) => a !== app) })
      },

      removeFromHome: (app) => {
        const s = get()
        set({
          pages: s.pages.map((p) => p.filter((a) => a !== app)),
          dock: s.dock.filter((a) => a !== app),
          hidden: s.hidden.includes(app) ? s.hidden : [...s.hidden, app],
        })
      },

      resetLayout: () => set({ pages: DEFAULT_PAGES, dock: DEFAULT_DOCK, hidden: [] }),
    }),
    {
      name: 'ios-home-os-v1',
      partialize: (s) => ({
        pages: s.pages,
        dock: s.dock,
        hidden: s.hidden,
        theme: s.theme,
        wallpaper: s.wallpaper,
        brightness: s.brightness,
        volume: s.volume,
        wifi: s.wifi,
        bluetooth: s.bluetooth,
        airplane: s.airplane,
        flashlight: s.flashlight,
        rotationLock: s.rotationLock,
        lowPower: s.lowPower,
        battery: s.battery,
      }),
    },
  ),
)
