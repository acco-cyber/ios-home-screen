'use client'

import { Pause, Play, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from 'lucide-react'
import { TRACKS } from '@/lib/ios/music-engine'
import { changeVolume, formatSec, usePlayer } from '@/lib/ios/player-store'
import { useOS } from '@/lib/ios/store'
import { HSlider } from '../HSlider'
import { cx } from '@/lib/ios/hooks'

const TRACK_BG = [
  'bg-gradient-to-b from-rose-500 via-red-600 to-zinc-900',
  'bg-gradient-to-b from-teal-400 via-cyan-600 to-zinc-900',
  'bg-gradient-to-b from-fuchsia-400 via-purple-500 to-zinc-900',
  'bg-gradient-to-b from-emerald-400 via-green-600 to-zinc-900',
]

export function MusicApp() {
  const index = usePlayer((s) => s.index)
  const playing = usePlayer((s) => s.playing)
  const position = usePlayer((s) => s.position)
  const failed = usePlayer((s) => s.failed)
  const toggle = usePlayer((s) => s.toggle)
  const next = usePlayer((s) => s.next)
  const prev = usePlayer((s) => s.prev)
  const seek = usePlayer((s) => s.seek)
  const select = usePlayer((s) => s.select)
  const volume = useOS((s) => s.volume)
  const track = TRACKS[index]
  const duration = track ? (track.bars * 4 * 60) / track.bpm : 0

  return (
    <div className={cx('absolute inset-0 text-white', TRACK_BG[index % TRACK_BG.length])}>
      <div className="no-scrollbar absolute inset-0 overflow-y-auto px-7 pb-16 pt-[68px] ios-scrollable">
        <div className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
          {track.vibe}
        </div>

        <div
          className="mx-auto mt-4 aspect-square w-[280px] rounded-2xl bg-cover bg-center shadow-[0_24px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/20"
          style={{ backgroundImage: `url(${track.cover})` }}
          role="img"
          aria-label={`${track.album} album art`}
        />

        <div className="mt-7 flex items-end justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-[22px] font-bold leading-tight">{track.title}</h2>
            <p className="truncate text-[19px] text-white/65">{track.artist}</p>
          </div>
        </div>

        {/* seek */}
        <div className="mt-4">
          <HSlider
            ariaLabel="Seek"
            value={position}
            max={Math.max(1, duration)}
            onChange={seek}
            trackClass="bg-white/25"
            fillClass="bg-white"
          />
          <div className="mt-1 flex justify-between text-[11px] font-medium tabular-nums text-white/60">
            <span>{formatSec(position)}</span>
            <span>-{formatSec(Math.max(0, duration - position))}</span>
          </div>
        </div>

        {/* controls */}
        <div className="mt-4 flex items-center justify-center gap-10">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous track"
            className="text-white/90 active:scale-90 transition-transform"
          >
            <SkipBack size={34} fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Play'}
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-black shadow-xl active:scale-90 transition-transform"
          >
            {playing ? (
              <Pause size={30} fill="currentColor" />
            ) : (
              <Play size={30} fill="currentColor" className="ml-1" />
            )}
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next track"
            className="text-white/90 active:scale-90 transition-transform"
          >
            <SkipForward size={34} fill="currentColor" />
          </button>
        </div>

        {/* volume */}
        <div className="mt-5 flex items-center gap-3">
          {volume === 0 ? (
            <VolumeX size={15} className="text-white/60" />
          ) : volume < 50 ? (
            <Volume1 size={15} className="text-white/60" />
          ) : (
            <Volume2 size={15} className="text-white/60" />
          )}
          <HSlider
            ariaLabel="Volume"
            value={volume}
            onChange={(v) => changeVolume(v)}
            trackClass="bg-white/25"
            fillClass="bg-white"
            className="flex-1"
          />
        </div>

        {failed && (
          <p className="mt-3 rounded-xl bg-black/40 p-3 text-center text-[12px] text-amber-200">
            Audio engine unavailable in this browser — controls are still fully interactive.
          </p>
        )}

        {/* up next */}
        <div className="mt-7">
          <div className="text-[16px] font-bold">Up Next</div>
          <div className="mt-2 space-y-1">
            {TRACKS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => select(i)}
                className={cx(
                  'flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors',
                  i === index ? 'bg-white/20' : 'hover:bg-white/10 active:bg-white/15',
                )}
              >
                <div
                  className="h-11 w-11 shrink-0 rounded-lg bg-cover bg-center ring-1 ring-white/20"
                  style={{ backgroundImage: `url(${t.cover})` }}
                />
                <div className="min-w-0 flex-1">
                  <div className={cx('truncate text-[14px] font-semibold', i === index && 'text-white')}>
                    {t.title}
                  </div>
                  <div className="truncate text-[12px] text-white/60">
                    {t.artist} · {t.album}
                  </div>
                </div>
                {i === index && playing && (
                  <div className="flex h-4 items-end gap-[2px]" aria-hidden>
                    {[0, 1, 2].map((b) => (
                      <div
                        key={b}
                        className="eq-bar w-[2.5px] rounded-sm bg-white"
                        style={{ height: 13, animationDelay: `${b * 160}ms` }}
                      />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-white/45">
          Demo tracks are synthesized live in your browser with the Web Audio API — no files streamed.
        </p>
      </div>
    </div>
  )
}
