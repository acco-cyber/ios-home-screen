'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useOS } from '@/lib/ios/store'
import { WALLPAPERS } from '@/lib/ios/apps'

/**
 * Parallax wallpaper layer. `offset` is the horizontal shift (design px)
 * driven by the current page / swipe gesture.
 */
export function Wallpaper({ offset }: { offset: number }) {
  const wallpaper = useOS((s) => s.wallpaper)
  const wp = WALLPAPERS[wallpaper] ?? WALLPAPERS.light

  return (
    <div className="absolute inset-0 overflow-hidden bg-zinc-900">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={wp.src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-y-0"
            style={{ left: '-60%', right: '-60%', transform: `translateX(${offset * 0.28}px)` }}
          >
            <Image
              src={wp.src}
              alt="Wallpaper"
              fill
              priority
              sizes="500px"
              className="object-cover"
              draggable={false}
            />
          </div>
        </motion.div>
      </AnimatePresence>
      {/* readability scrim */}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  )
}
