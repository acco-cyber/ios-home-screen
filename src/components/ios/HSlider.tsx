'use client'

import { useRef } from 'react'
import { cx } from '@/lib/ios/hooks'

interface HSliderProps {
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
  className?: string
  trackClass?: string
  fillClass?: string
  ariaLabel: string
}

/** iOS-style horizontal slider (used for seek, volume, brightness). */
export function HSlider({
  value,
  min = 0,
  max = 100,
  onChange,
  className,
  trackClass = 'bg-white/25',
  fillClass = 'bg-white',
  ariaLabel,
}: HSliderProps) {
  const ref = useRef<HTMLDivElement>(null)
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

  const setFromEvent = (clientX: number) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const p = (clientX - r.left) / r.width
    onChange(Math.round(min + Math.min(1, Math.max(0, p)) * (max - min)))
  }

  return (
    <div
      ref={ref}
      role="slider"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      onPointerDown={(e) => {
        e.stopPropagation()
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        setFromEvent(e.clientX)
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) setFromEvent(e.clientX)
      }}
      className={cx('relative h-[6px] cursor-pointer touch-none rounded-full', trackClass, className)}
    >
      <div
        className={cx('pointer-events-none absolute inset-y-0 left-0 rounded-full transition-[width] duration-75', fillClass)}
        style={{ width: `${pct}%` }}
      >
        <div className="absolute -right-[5px] top-1/2 h-[13px] w-[13px] -translate-y-1/2 rounded-full bg-white shadow-md" />
      </div>
    </div>
  )
}
