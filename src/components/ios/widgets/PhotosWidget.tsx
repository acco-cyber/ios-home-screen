'use client'

import { useEffect, useState } from 'react'
import { PHOTOS } from '@/lib/ios/photos'
import { usePulse, cx } from '@/lib/ios/hooks'
import { useOS } from '@/lib/ios/store'

export function PhotosWidget({ className }: { className?: string }) {
  const launch = useOS((s) => s.launch)
  const [start, setStart] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setStart((s) => (s + 1) % PHOTOS.length)
      setTick((x) => x + 1)
    }, 8000)
    return () => clearInterval(t)
  }, [])

  const pulse = usePulse(tick)
  const featured = [0, 1, 2, 3].map((i) => PHOTOS[(start + i) % PHOTOS.length])

  return (
    <button
      type="button"
      data-launch="photos"
      onClick={() => launch('photos')}
      aria-label="Photos widget"
      className={cx(
        'relative col-span-2 grid h-[158px] grid-cols-2 grid-rows-2 gap-[2px] overflow-hidden rounded-[26px] bg-zinc-800 shadow-[0_10px_24px_rgba(0,0,0,0.35)] ring-1 ring-white/15 transition-transform duration-150 active:scale-[0.96]',
        pulse && 'widget-pulse',
        className,
      )}
    >
      {featured.map((p, i) => (
        <div key={`${p.id}-${i}`} className="relative overflow-hidden">
          <img src={p.src} alt={p.title} className="h-full w-full object-cover" draggable={false} />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-1.5 pt-4 text-left">
        <span className="text-[11px] font-semibold text-white">Memories</span>
      </div>
    </button>
  )
}
