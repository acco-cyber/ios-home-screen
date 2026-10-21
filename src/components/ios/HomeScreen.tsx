'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useOS, type SlotRef } from '@/lib/ios/store'
import { APP_LIST, APPS } from '@/lib/ios/apps'
import type { AppId, LaunchRect } from '@/lib/ios/types'
import { PHONE_W } from '@/lib/ios/types'
import { AppIcon } from './AppIcon'
import { Wallpaper } from './Wallpaper'
import { WeatherWidget } from './widgets/WeatherWidget'
import { CalendarWidget } from './widgets/CalendarWidget'
import { MusicWidget } from './widgets/MusicWidget'
import { PhotosWidget } from './widgets/PhotosWidget'
import { cx } from '@/lib/ios/hooks'

interface PhoneCtx {
  scale: number
  getLaunchRect: (el: Element) => LaunchRect
}

export const PhoneContext = React.createContext<PhoneCtx>({
  scale: 1,
  getLaunchRect: () => ({ x: 0, y: 0, width: 58, height: 58 }),
})

type GestureMode = 'idle' | 'press' | 'swipe' | 'drag'

interface Gesture {
  mode: GestureMode
  startX: number
  startY: number
  lastX: number
  lastY: number
  lastT: number
  slot: SlotRef | null
  app: AppId | null
  el: HTMLElement | null
  originX: number
  originY: number
  enteredWiggle: boolean
  edgeDir: number | null
  dwellTimer: ReturnType<typeof setTimeout> | null
}

function parseSlot(data: string): SlotRef | null {
  if (data.startsWith('dock-')) return { kind: 'dock', index: parseInt(data.slice(5), 10) }
  if (data.startsWith('p')) {
    const m = data.match(/^p(\d+)-(\d+)$/)
    if (m) return { kind: 'page', page: parseInt(m[1], 10), index: parseInt(m[2], 10) }
  }
  return null
}

function slotKey(s: SlotRef): string {
  return s.kind === 'dock' ? `dock-${s.index}` : `p${s.page}-${s.index}`
}

export function HomeScreen() {
  const pages = useOS((s) => s.pages)
  const dock = useOS((s) => s.dock)
  const hidden = useOS((s) => s.hidden)
  const page = useOS((s) => s.page)
  const wiggle = useOS((s) => s.wiggle)
  const openApp = useOS((s) => s.openApp)
  const setPage = useOS((s) => s.setPage)
  const setWiggle = useOS((s) => s.setWiggle)
  const launchStore = useOS((s) => s.launch)
  const removeFromHome = useOS((s) => s.removeFromHome)

  const { scale, getLaunchRect } = React.useContext(PhoneContext)
  const rootRef = useRef<HTMLDivElement>(null)
  const [dragX, setDragX] = useState<number | null>(null)
  const [dragVisual, setDragVisual] = useState<{ key: string; x: number; y: number } | null>(null)

  const g = useRef<Gesture | null>(null)
  const suppressClick = useRef(false)

  const totalWidth = (pages.length + 1) * PHONE_W

  /* ------------------------------- gestures ------------------------------- */
  useEffect(() => {
    const vp = rootRef.current
    if (!vp) return

    const state = () => useOS.getState()

    const hitTest = (x: number, y: number, exclude: string | null): SlotRef | null => {
      const els = vp.querySelectorAll<HTMLElement>('[data-slot]')
      for (const el of els) {
        const key = el.dataset.slot ?? ''
        if (key === exclude) continue
        const r = el.getBoundingClientRect()
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return parseSlot(key)
      }
      return null
    }

    const clearDwell = () => {
      if (g.current?.dwellTimer) clearTimeout(g.current.dwellTimer)
      if (g.current) {
        g.current.dwellTimer = null
        g.current.edgeDir = null
      }
    }

    const reanchor = (clientX: number, clientY: number) => {
      const st = g.current
      if (!st?.el) return
      requestAnimationFrame(() => {
        if (!st.el) return
        const r = st.el.getBoundingClientRect()
        st.originX = clientX - r.left
        st.originY = clientY - r.top
      })
    }

    const scheduleEdgeFlip = (dir: -1 | 1) => {
      const st = g.current
      if (!st || st.dwellTimer || st.edgeDir === dir) return
      st.edgeDir = dir
      st.dwellTimer = setTimeout(() => {
        const cur = g.current
        if (!cur || cur.mode !== 'drag' || !cur.app) return
        const s = state()
        const next = Math.min(s.pages.length - 1, Math.max(0, s.page + dir))
        if (next !== s.page) {
          setPage(next)
          useOS.getState().moveAppToEnd(cur.app, next)
          cur.slot = { kind: 'page', page: next, index: Math.max(0, (s.pages[next]?.length ?? 1) - 1) }
          reanchor(cur.lastX, cur.lastY)
        }
        if (cur) {
          cur.dwellTimer = null
          cur.edgeDir = null
        }
      }, 500)
    }

    const onPointerMove = (e: PointerEvent) => {
      const st = g.current
      if (!st) return
      const sc = state()
      const dx = (e.clientX - st.startX) / scale
      const dy = (e.clientY - st.startY) / scale
      st.lastX = e.clientX
      st.lastY = e.clientY

      if (st.mode === 'press') {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          if (st.dwellTimer) clearTimeout(st.dwellTimer)
          if (sc.wiggle && st.slot && st.app) {
            st.mode = 'drag'
            if (st.el) {
              const r = st.el.getBoundingClientRect()
              st.originX = e.clientX - r.left
              st.originY = e.clientY - r.top
            }
          } else if (Math.abs(dx) > Math.abs(dy)) {
            st.mode = 'swipe'
          } else {
            st.mode = 'idle'
          }
        }
      }

      if (st.mode === 'swipe') {
        let x = dx
        const atStart = sc.page === 0
        const atEnd = sc.page >= sc.pages.length
        if ((atStart && x > 0) || (atEnd && x < 0)) x = x * 0.32
        setDragX(x)
      }

      if (st.mode === 'drag' && st.app) {
        const vx = (e.clientX - st.originX) / scale
        const vy = (e.clientY - st.originY) / scale
        setDragVisual({ key: slotKey(st.slot as SlotRef), x: vx, y: vy })
        const target = hitTest(e.clientX, e.clientY, st.el?.dataset.slot ?? null)
        if (target && st.slot && slotKey(target) !== slotKey(st.slot)) {
          useOS.getState().swapSlots(st.slot, target)
          st.slot = target
          reanchor(e.clientX, e.clientY)
        }
        const phoneR = vp.getBoundingClientRect()
        if (e.clientX < phoneR.left + 34 * scale) scheduleEdgeFlip(-1)
        else if (e.clientX > phoneR.right - 34 * scale) scheduleEdgeFlip(1)
        else clearDwell()
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      const st = g.current
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      if (!st) return
      if (st.dwellTimer) clearTimeout(st.dwellTimer)
      const sc = state()

      if (st.mode === 'swipe') {
        const dt = Math.max(1, performance.now() - st.lastT)
        const vel = (e.clientX - st.lastX) / scale / dt
        const dx = (e.clientX - st.startX) / scale
        suppressClick.current = true
        if (Math.abs(dx) > PHONE_W * 0.24 || Math.abs(vel) > 0.45) {
          const dir = dx < 0 ? 1 : -1
          setPage(Math.min(sc.pages.length, Math.max(0, sc.page + dir)))
        }
        setDragX(null)
      } else if (st.mode === 'drag') {
        suppressClick.current = true
        setDragVisual(null)
      } else if (st.mode === 'press') {
        const moved =
          Math.abs((e.clientX - st.startX) / scale) > 6 || Math.abs((e.clientY - st.startY) / scale) > 6
        if (!moved) {
          const target = e.target as HTMLElement
          const launchEl = target.closest<HTMLElement>('[data-app]')
          const widgetEl = target.closest<HTMLElement>('[data-launch]')
          if (launchEl?.dataset.app && !st.enteredWiggle && !sc.wiggle) {
            suppressClick.current = true
            const app = launchEl.dataset.app as AppId
            if (sc.hidden.includes(app)) useOS.getState().restoreApp(app)
            launchStore(app, getLaunchRect(launchEl))
          } else if (widgetEl?.dataset.launch && !sc.wiggle) {
            suppressClick.current = true
            launchStore(widgetEl.dataset.launch as AppId, getLaunchRect(widgetEl))
          } else if (!target.closest('[data-app],[data-launch]') && sc.wiggle) {
            setWiggle(false)
          } else if (st.enteredWiggle) {
            suppressClick.current = true
          }
        }
      }
      g.current = null
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const sc = state()
      if (sc.openApp || sc.notifOpen || sc.controlOpen) return
      suppressClick.current = false
      const target = e.target as HTMLElement
      const iconEl = target.closest<HTMLElement>('[data-slot]')
      g.current = {
        mode: 'press',
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        lastT: performance.now(),
        slot: iconEl ? parseSlot(iconEl.dataset.slot ?? '') : null,
        app: iconEl ? ((iconEl.dataset.app as AppId) ?? null) : null,
        el: iconEl,
        originX: 0,
        originY: 0,
        enteredWiggle: false,
        edgeDir: null,
        dwellTimer: null,
      }
      if (iconEl && !sc.wiggle) {
        const timer = setTimeout(() => {
          const st = g.current
          if (st && st.mode === 'press') {
            st.enteredWiggle = true
            setWiggle(true)
          }
        }, 420)
        g.current.dwellTimer = timer
      }
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
    }

    vp.addEventListener('pointerdown', onPointerDown)
    return () => {
      vp.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [scale, getLaunchRect, launchStore, setWiggle, setPage])

  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressClick.current = false
    }
  }

  const wallOffset = -(page * PHONE_W) + (dragX ?? 0)
  const x = -(page * PHONE_W) + (dragX ?? 0)

  const sortedApps = useMemo(() => [...APP_LIST].sort((a, b) => a.name.localeCompare(b.name)), [])

  return (
    <div ref={rootRef} className="absolute inset-0 touch-none" onClickCapture={onClickCapture}>
      {/* parallax wallpaper follows pages at 28% speed */}
      <div className="absolute inset-0 overflow-hidden">
        <Wallpaper offset={wallOffset} />
      </div>

      {/* pages viewport */}
      <div className="absolute inset-x-0 top-[54px] bottom-[188px]">
        <motion.div
          className="flex h-full"
          animate={{ x }}
          transition={dragX === null ? { type: 'spring', stiffness: 480, damping: 42 } : { duration: 0 }}
          style={{ width: totalWidth }}
        >
          {pages.map((apps, pi) => (
            <div key={pi} className="h-full w-[390px] shrink-0 px-5">
              {pi === 0 && (
                <div className="mb-4 grid grid-cols-4 gap-3">
                  <WeatherWidget />
                  <CalendarWidget />
                </div>
              )}
              {pi === 1 && (
                <div className="mb-4 grid grid-cols-4 gap-3">
                  <MusicWidget />
                  <PhotosWidget />
                </div>
              )}
              <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                {apps.map((app, ai) => (
                  <div key={app} className="flex justify-center">
                    <AppIcon
                      app={app}
                      wiggle={wiggle}
                      slotRefData={`p${pi}-${ai}`}
                      dragStyle={
                        dragVisual?.key === `p${pi}-${ai}`
                          ? { x: dragVisual.x, y: dragVisual.y, active: true }
                          : undefined
                      }
                      onRemove={() => removeFromHome(app)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* App Library page */}
          <div className="h-full w-[390px] shrink-0 px-3">
            <div className="glass flex h-full flex-col rounded-[34px] bg-black/35 ring-1 ring-white/10 p-4 [touch-action:pan-y]">
              <div className="flex items-center justify-center gap-1.5 rounded-full bg-white/15 py-1.5 text-[12px] font-medium text-white/80">
                <Search size={12} />
                Search
              </div>
              <div className="mt-3 text-[12px] font-semibold text-white/70">All Apps</div>
              <div className="no-scrollbar mt-2 grid flex-1 grid-cols-4 content-start gap-y-5 overflow-y-auto">
                {sortedApps.map((def) => (
                  <div key={def.id} className="flex justify-center">
                    <AppIcon app={def.id} wiggle={false} slotRefData={`lib-${def.id}`} showLabel />
                  </div>
                ))}
              </div>
              {hidden.length > 0 && (
                <>
                  <div className="mt-2 text-[12px] font-semibold text-white/70">Removed from Home Screen</div>
                  <div className="mt-2 grid grid-cols-4 content-start gap-y-4">
                    {hidden
                      .filter((a) => APPS[a])
                      .map((a) => (
                        <div key={a} className="flex justify-center opacity-80">
                          <AppIcon app={a} wiggle={false} slotRefData={`libh-${a}`} showLabel />
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* wiggle done button */}
      {wiggle && (
        <button
          type="button"
          onClick={() => setWiggle(false)}
          className="absolute right-4 top-[62px] z-30 rounded-full bg-white/95 px-4 py-1.5 text-[13px] font-semibold text-zinc-900 shadow-lg active:scale-95"
        >
          Done
        </button>
      )}

      {/* page dots */}
      <div className="absolute inset-x-0 bottom-[168px] z-20 flex items-center justify-center gap-2">
        {Array.from({ length: pages.length + 1 }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Page ${i + 1}`}
            onClick={() => setPage(i)}
            className={cx('h-[7px] w-[7px] rounded-full transition-all', i === page ? 'bg-white' : 'bg-white/40')}
          />
        ))}
      </div>

      {/* dock */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-6">
        <div className="glass grid h-[92px] grid-cols-4 place-items-center rounded-[30px] bg-white/15 ring-1 ring-white/10">
          {dock.map((app, i) => (
            <AppIcon
              key={app}
              app={app}
              wiggle={wiggle}
              showLabel={false}
              slotRefData={`dock-${i}`}
              dragStyle={
                dragVisual?.key === `dock-${i}` ? { x: dragVisual.x, y: dragVisual.y, active: true } : undefined
              }
              onRemove={() => removeFromHome(app)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
