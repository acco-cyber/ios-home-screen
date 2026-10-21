'use client'

import { ChevronRight, Pause, Play } from 'lucide-react'
import { TRACKS } from '@/lib/ios/music-engine'
import { usePlayer } from '@/lib/ios/player-store'
import { usePulse, cx } from '@/lib/ios/hooks'
import { useOS } from '@/lib/ios/store'

export function MusicWidget({ className }: { className?: string }) {
  const launch = useOS((s) => s.launch)
  const index = usePlayer((s) => s.index)
  const playing = usePlayer((s) => s.playing)
  const position = usePlayer((s) => s.position)
  const toggle = usePlayer((s) => s.toggle)
  const next = usePlayer((s) => s.next)
  const track = TRACKS[index]
  const pulse = usePulse(track.id)
  const duration = track ? (track.bars * 4 * 60) / track.bpm : 0
  const progress = duration > 0 ? Math.min(1, position / duration) : 0

  return (
    <div
      className={cx(
        'glass relative col-span-4 flex h-[158px] items-center gap-3.5 overflow-hidden rounded-[26px] bg-black/45 p-4 text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)] ring-1 ring-white/15 transition-transform duration-150 active:scale-[0.98]',
        pulse && 'widget-pulse',
        className,
      )}
      role="group"
      aria-label="Music widget"
    >
      <button
        type="button"
        data-launch="music"
        onClick={() => launch('music')}
        aria-label={`Open Music — ${track.title}`}
        className="relative h-[118px] w-[118px] shrink-0 overflow-hidden rounded-[18px] bg-cover bg-center shadow-lg ring-1 ring-white/20 active:scale-95"
        style={{ backgroundImage: `url(${track.cover})` }}
      />
      <div className="flex min-w-0 flex-1 flex-col self-stretch py-1">
        <div className="min-w-0">
          <div className="truncate text-[17px] font-bold leading-tight">{track.title}</div>
          <div className="truncate text-[13px] text-white/70">
            {track.artist} · {track.album}
          </div>
        </div>
        <div className="mt-2 h-[4px] w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white/90 transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/60">{track.vibe}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? 'Pause' : 'Play'}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-md active:scale-90"
            >
              {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next track"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
