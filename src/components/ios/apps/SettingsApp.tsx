'use client'

import { useState } from 'react'
import {
  Bluetooth,
  ChevronRight,
  Info,
  LayoutGrid,
  Moon,
  Plane,
  RotateCcw,
  Sun,
  Volume2,
  Wifi,
} from 'lucide-react'
import { useOS } from '@/lib/ios/store'
import { changeVolume } from '@/lib/ios/player-store'
import { WALLPAPERS } from '@/lib/ios/apps'
import type { ThemeMode, WallpaperId } from '@/lib/ios/types'
import { HSlider } from '../HSlider'
import { cx } from '@/lib/ios/hooks'

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx(
        'relative h-[28px] w-[46px] shrink-0 rounded-full transition-colors duration-200',
        on ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600',
      )}
    >
      <span
        className={cx(
          'absolute top-[2px] h-[24px] w-[24px] rounded-full bg-white shadow transition-all duration-200',
          on ? 'left-[20px]' : 'left-[2px]',
        )}
      />
    </button>
  )
}

function Row({
  icon,
  title,
  right,
  onClick,
  last,
}: {
  icon?: React.ReactNode
  title: string
  right?: React.ReactNode
  onClick?: () => void
  last?: boolean
}) {
  const inner = (
    <>
      {icon && <span className="flex h-[26px] w-[26px] items-center justify-center">{icon}</span>}
      <span className="flex-1 text-[15px]">{title}</span>
      {right}
      {onClick && <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-500" />}
    </>
  )
  const cls = cx(
    'flex w-full items-center gap-3 px-4 py-[11px] text-left',
    !last && 'border-b border-zinc-200/70 dark:border-zinc-700/70',
    onClick && 'active:bg-zinc-100 dark:active:bg-zinc-700/50',
  )
  // avoid nested <button> (hydration error) — switches are buttons themselves
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    )
  }
  return <div className={cls}>{inner}</div>
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 px-4">
      {title && <div className="mb-1.5 px-1 text-[12px] font-medium uppercase tracking-wide text-zinc-400">{title}</div>}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10">
        {children}
      </div>
    </div>
  )
}

const THEMES: { id: ThemeMode; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'auto', label: 'Auto' },
]

export function SettingsApp() {
  const s = useOS()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="absolute inset-0 bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-16 pt-[62px] ios-scrollable">
        <header className="px-5">
          <h1 className="text-[32px] font-bold leading-tight">Settings</h1>
        </header>

        {/* profile */}
        <Section>
          <div className="flex items-center gap-3.5 px-4 py-3.5">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-b from-teal-400 to-emerald-600 text-[19px] font-bold text-white shadow">
              AC
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[18px] font-semibold">Alex Chen</div>
              <div className="text-[12.5px] text-zinc-500 dark:text-zinc-400">Z.ai Account, iCloud, Media & Purchases</div>
            </div>
            <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-500" />
          </div>
        </Section>

        {/* appearance */}
        <Section title="Appearance">
          <div className="p-3.5">
            <div className="flex rounded-xl bg-zinc-200/70 p-1 dark:bg-zinc-700/60">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => s.setTheme(t.id)}
                  className={cx(
                    'flex-1 rounded-lg py-1.5 text-[13px] font-semibold transition-all',
                    s.theme === t.id
                      ? 'bg-white text-zinc-900 shadow dark:bg-zinc-500 dark:text-white'
                      : 'text-zinc-500 dark:text-zinc-400',
                  )}
                  aria-pressed={s.theme === t.id}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {(Object.keys(WALLPAPERS) as WallpaperId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => s.setWallpaper(id)}
                  aria-label={`Wallpaper ${WALLPAPERS[id].label}`}
                  aria-pressed={s.wallpaper === id}
                  className={cx(
                    'relative aspect-[9/16] overflow-hidden rounded-xl ring-2 transition-all active:scale-95',
                    s.wallpaper === id ? 'ring-emerald-500' : 'ring-transparent',
                  )}
                >
                  <img src={WALLPAPERS[id].src} alt={WALLPAPERS[id].label} className="h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-center text-[9px] font-medium text-white">
                    {WALLPAPERS[id].label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* display & sound */}
        <Section title="Display & Sound">
          <div className="flex items-center gap-3 px-4 py-3">
            <Sun size={17} className="text-zinc-500" />
            <HSlider
              ariaLabel="Brightness"
              value={s.brightness}
              min={10}
              onChange={s.setBrightness}
              trackClass="bg-zinc-200 dark:bg-zinc-600"
              fillClass="bg-zinc-900 dark:bg-white"
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Volume2 size={17} className="text-zinc-500" />
            <HSlider
              ariaLabel="Volume"
              value={s.volume}
              onChange={(v) => changeVolume(v)}
              trackClass="bg-zinc-200 dark:bg-zinc-600"
              fillClass="bg-zinc-900 dark:bg-white"
              className="flex-1"
            />
          </div>
        </Section>

        {/* connectivity */}
        <Section title="Connectivity">
          <Row
            icon={<Plane size={17} className="text-orange-500" />}
            title="Airplane Mode"
            right={<Switch on={s.airplane} onChange={s.setAirplane} label="Airplane Mode" />}
          />
          <Row
            icon={<Wifi size={17} className="text-sky-600" />}
            title="Wi-Fi"
            right={<Switch on={s.wifi} onChange={s.setWifi} label="Wi-Fi" />}
          />
          <Row
            icon={<Bluetooth size={17} className="text-sky-600" />}
            title="Bluetooth"
            last
            right={<Switch on={s.bluetooth} onChange={s.setBluetooth} label="Bluetooth" />}
          />
        </Section>

        {/* home screen */}
        <Section title="Home Screen">
          <Row
            icon={<LayoutGrid size={17} className="text-zinc-500" />}
            title={confirmReset ? 'Tap again to confirm reset' : 'Reset Home Screen Layout'}
            onClick={() => {
              if (confirmReset) {
                s.resetLayout()
                setConfirmReset(false)
              } else {
                setConfirmReset(true)
                setTimeout(() => setConfirmReset(false), 3000)
              }
            }}
          />
          <Row
            icon={<RotateCcw size={17} className="text-zinc-500" />}
            title="Use Dark Icon Appearance"
            last
            right={<Switch on={s.theme === 'dark'} onChange={(v) => s.setTheme(v ? 'dark' : 'light')} label="Dark icons" />}
          />
        </Section>

        {/* about */}
        <Section title="About">
          <Row icon={<Moon size={16} className="text-zinc-500" />} title="Model" right={<span className="text-[13px] text-zinc-400">iPhone (Web)</span>} />
          <Row icon={<Info size={16} className="text-zinc-500" />} title="Software Version" right={<span className="text-[13px] text-zinc-400">iOS 17.2 (Web)</span>} />
          <Row icon={<Info size={16} className="text-zinc-500" />} title="Framework" right={<span className="text-[13px] text-zinc-400">Next.js 16</span>} />
          <Row
            icon={<Info size={16} className="text-zinc-500" />}
            title="Battery"
            last
            right={<span className="text-[13px] text-zinc-400">{s.battery}% {s.lowPower ? '· Low Power' : ''}</span>}
          />
        </Section>

        <p className="mt-5 text-center text-[11px] text-zinc-400">
          Theme, wallpaper, toggles and layout are saved to localStorage
        </p>
      </div>
    </div>
  )
}
