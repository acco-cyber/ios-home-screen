'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, Heart, X } from 'lucide-react'
import { PHOTOS } from '@/lib/ios/photos'
import { cx } from '@/lib/ios/hooks'

export function PhotosApp() {
  const [viewer, setViewer] = useState<number | null>(null)
  const [liked, setLiked] = useState<Record<string, boolean>>({})

  return (
    <div className="absolute inset-0 bg-zinc-950 text-white">
      <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-16 pt-[66px] ios-scrollable">
        <header className="flex items-end justify-between px-5">
          <div>
            <h1 className="text-[30px] font-bold leading-tight">Photos</h1>
            <p className="text-[13px] text-zinc-400">{PHOTOS.length} items · Recents</p>
          </div>
          <span className="pb-1 text-[13px] font-medium text-sky-400">Select</span>
        </header>

        <div className="mt-3 grid grid-cols-3 gap-[2px]">
          {PHOTOS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setViewer(i)}
              className="relative aspect-square overflow-hidden active:opacity-80"
              aria-label={`Open photo ${p.title}`}
            >
              <img src={p.src} alt={p.title} loading="lazy" className="h-full w-full object-cover" draggable={false} />
              {liked[p.id] && (
                <Heart size={14} className="absolute bottom-1.5 left-1.5 fill-red-500 text-red-500 drop-shadow" />
              )}
            </button>
          ))}
        </div>

        <p className="mt-5 px-5 text-center text-[11px] text-zinc-500">
          Starter gallery · tap a photo to view · swipe between photos
        </p>
      </div>

      <AnimatePresence>
        {viewer !== null && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col bg-black"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between px-4 pb-2 pt-[58px]">
              <button
                type="button"
                onClick={() => setViewer(null)}
                aria-label="Back to grid"
                className="flex items-center text-sky-400 active:opacity-60"
              >
                <ChevronLeft size={26} />
                <span className="text-[16px]">Photos</span>
              </button>
              <button
                type="button"
                onClick={() => setLiked((m) => ({ ...m, [PHOTOS[viewer].id]: !m[PHOTOS[viewer].id] }))}
                aria-label="Like photo"
                className="active:scale-90"
              >
                <Heart
                  size={22}
                  className={cx(liked[PHOTOS[viewer].id] ? 'fill-red-500 text-red-500' : 'text-white')}
                />
              </button>
            </div>

            <div className="relative flex-1">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={viewer}
                  className="absolute inset-0 flex cursor-grab items-center justify-center px-1"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  initial={{ opacity: 0.4, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.18 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) setViewer((v) => Math.min(PHOTOS.length - 1, (v ?? 0) + 1))
                    else if (info.offset.x > 60) setViewer((v) => Math.max(0, (v ?? 0) - 1))
                  }}
                >
                  <img
                    src={PHOTOS[viewer].src}
                    alt={PHOTOS[viewer].title}
                    className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>

              <button
                type="button"
                onClick={() => setViewer(null)}
                aria-label="Close viewer"
                className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 active:bg-white/30"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 pb-12 pt-3 text-center">
              <div className="text-[15px] font-semibold">{PHOTOS[viewer].title}</div>
              <div className="text-[12px] text-zinc-400">
                {PHOTOS[viewer].place} · {PHOTOS[viewer].date}
              </div>
              <div className="mt-2 text-[11px] tabular-nums text-zinc-500">
                {viewer + 1} of {PHOTOS.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
