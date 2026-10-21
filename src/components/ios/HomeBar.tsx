'use client'

import { useRef } from 'react'
import { cx } from '@/lib/ios/hooks'

/**
 * iPhone home indicator bar. Swipe up (or tap) triggers onHome.
 */
export function HomeBar({ onHome, light = true }: { onHome: () => void; light?: boolean }) {
  const startY = useRef<number | null>(null)

  return (
    <div
      role="button"
      aria-label="Home"
      className="absolute inset-x-0 bottom-0 z-50 flex h-[26px] cursor-pointer items-end justify-center pb-[7px] touch-none"
      onPointerDown={(e) => {
        e.stopPropagation()
        startY.current = e.clientY
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
      }}
      onPointerUp={(e) => {
        e.stopPropagation()
        const dy = startY.current !== null ? startY.current - e.clientY : 0
        startY.current = null
        if (dy > 18 || Math.abs(dy) <= 4) onHome()
      }}
    >
      <div
        className={cx(
          'h-[5px] w-[134px] rounded-full transition-opacity',
          light ? 'bg-white/90' : 'bg-black/60',
        )}
      />
    </div>
  )
}
