'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePlayer } from '@/lib/ios/player-store'
import { TRACKS } from '@/lib/ios/music-engine'
import { useOS } from '@/lib/ios/store'

function EqBars({ active }: { active: boolean }) {
  return (
    <div className="flex h-4 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={active ? 'eq-bar w-[2.5px] rounded-sm bg-white/90' : 'w-[2.5px] rounded-sm bg-white/40'}
          style={{ height: 14, animationDelay: `${i * 140}ms` }}
        />
      ))}
    </div>
  )
}

export function DynamicIsland() {
  const playing = usePlayer((s) => s.playing)
  const index = usePlayer((s) => s.index)
  const openApp = useOS((s) => s.openApp)
  const launch = useOS((s) => s.launch)
  const track = TRACKS[index]

  return (
    <motion.button
      layout
      onClick={() => {
        if (!openApp) launch('music')
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="absolute left-1/2 top-[11px] z-50 flex h-[32px] -translate-x-1/2 items-center justify-center gap-2 overflow-hidden rounded-full bg-black px-3 shadow-lg"
      style={{ width: playing ? 208 : 118 }}
      aria-label={playing ? `Now playing ${track.title}` : 'Dynamic Island'}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {playing ? (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2.5"
          >
            <div
              className="h-6 w-6 shrink-0 rounded-full bg-cover bg-center ring-1 ring-white/20"
              style={{ backgroundImage: `url(${track.cover})` }}
            />
            <div className="w-[118px] overflow-hidden text-left">
              <div className="marquee-track whitespace-nowrap text-[11px] font-semibold leading-tight text-white">
                {track.title} — {track.artist}
              </div>
            </div>
            <EqBars active />
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="h-[9px] w-[9px] rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
