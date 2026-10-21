'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Bluetooth,
  ChevronRight,
  Flashlight,
  Lock,
  Moon,
  Pause,
  Plane,
  Play,
  Sun,
  Volume2,
  Wifi,
  Zap,
} from 'lucide-react'
import { useOS } from '@/lib/ios/store'
import { TRACKS } from '@/lib/ios/music-engine'
import { changeVolume, usePlayer } from '@/lib/ios/player-store'
import { cx } from '@/lib/ios/hooks'

function Toggle({
  on,
  onClick,
  label,
  children,
  activeClass = 'bg-white text-black',
}: {
  on: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
  activeClass?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        'flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg ring-1 ring-white/10 transition-all duration-200 active:scale-90',
        on ? activeClass : 'bg-white/15 text-white',
      )}
    >
      {children}
    </button>
  )
}

function VSlider({
  value,
  onChange,
  label,
  icon,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  icon: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const setFromEvent = (clientY: number) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const pct = 1 - (clientY - r.top) / r.height
    onChange(Math.round(Math.min(100, Math.max(5, pct * 100))))
  }
  return (
    <div
      ref={ref}
      role="slider"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={5}
      aria-valuemax={100}
      onPointerDown={(e) => {
        e.stopPropagation()
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        setFromEvent(e.clientY)
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) setFromEvent(e.clientY)
      }}
      className="relative h-[150px] w-full cursor-pointer overflow-hidden rounded-[22px] bg-white/15 shadow-lg ring-1 ring-white/10"
    >
      <div className="absolute inset-x-0 bottom-0 bg-white/90 transition-[height] duration-100" style={{ height: `${value}%` }} />
      <div className="absolute inset-x-0 bottom-3 flex justify-center text-white mix-blend-exclusion">{icon}</div>
    </div>
  )
}

export function ControlCenter() {
  const s = useOS()
  const close = useOS((st) => st.setControlOpen)
  const index = usePlayer((p) => p.index)
  const playing = usePlayer((p) => p.playing)
  const toggle = usePlayer((p) => p.toggle)
  const next = usePlayer((p) => p.next)
  const track = TRACKS[index]

  return (
    <motion.div
      className="absolute inset-0 z-[70]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        aria-label="Close Control Center"
        onClick={() => close(false)}
        className="absolute inset-0 bg-black/25"
      />
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.12, bottom: 0.55 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 70 || info.velocity.y > 450) close(false)
        }}
        initial={{ y: '104%' }}
        animate={{ y: 0 }}
        exit={{ y: '104%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="glass absolute inset-x-0 bottom-0 rounded-t-[38px] bg-zinc-900/72 p-4 pb-8 pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-[5px] w-9 rounded-full bg-white/40" />

        <div className="grid grid-cols-4 gap-3">
          {/* connectivity */}
          <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-[26px] bg-white/10 p-3.5 ring-1 ring-white/10">
            <div className="grid grid-cols-2 gap-2.5">
              <Toggle on={s.airplane} onClick={() => s.setAirplane(!s.airplane)} label="Airplane Mode">
                <Plane size={21} />
              </Toggle>
              <Toggle on={s.wifi} onClick={() => s.setWifi(!s.wifi)} label="Wi-Fi">
                <Wifi size={21} />
              </Toggle>
              <Toggle on={s.bluetooth} onClick={() => s.setBluetooth(!s.bluetooth)} label="Bluetooth">
                <Bluetooth size={21} />
              </Toggle>
              <Toggle on={!s.airplane} onClick={() => s.setAirplane(!s.airplane)} label="Cellular">
                <span className="text-[13px] font-bold">5G</span>
              </Toggle>
            </div>
            <div className="mt-2 text-[11px] font-medium text-white/70">
              {s.airplane ? 'Airplane Mode On' : s.wifi ? 'HomeFi 5G' : 'Cellular Data'}
            </div>
          </div>

          {/* music */}
          <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-[26px] bg-white/10 p-3.5 ring-1 ring-white/10">
            <div className="flex items-center gap-2.5">
              <div
                className="h-10 w-10 shrink-0 rounded-lg bg-cover bg-center ring-1 ring-white/20"
                style={{ backgroundImage: `url(${track.cover})` }}
              />
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold text-white">{track.title}</div>
                <div className="truncate text-[11px] text-white/60">{track.artist}</div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? 'Pause' : 'Play'}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white active:scale-90"
              >
                {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next track"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white active:scale-90"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* sliders */}
          <VSlider value={s.brightness} onChange={s.setBrightness} label="Brightness" icon={<Sun size={19} />} />
          <VSlider
            value={s.volume}
            onChange={(v) => changeVolume(v)}
            label="Volume"
            icon={<Volume2 size={19} />}
          />

          {/* bottom row */}
          <Toggle
            on={s.flashlight}
            onClick={() => s.setFlashlight(!s.flashlight)}
            label="Flashlight"
            activeClass="bg-white text-zinc-900"
          >
            <Flashlight size={21} />
          </Toggle>
          <Toggle on={s.theme === 'dark'} onClick={() => s.setTheme(s.theme === 'dark' ? 'light' : 'dark')} label="Dark Mode">
            <Moon size={21} />
          </Toggle>
          <Toggle on={s.rotationLock} onClick={() => s.setRotationLock(!s.rotationLock)} label="Rotation Lock">
            <Lock size={21} />
          </Toggle>
          <Toggle on={s.lowPower} onClick={() => s.setLowPower(!s.lowPower)} label="Low Power Mode" activeClass="bg-amber-400 text-zinc-900">
            <Zap size={21} />
          </Toggle>
        </div>
      </motion.div>
    </motion.div>
  )
}
