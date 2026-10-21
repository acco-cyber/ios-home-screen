'use client'

import { create } from 'zustand'
import { TRACKS, engine } from './music-engine'
import { useOS } from './store'

interface PlayerState {
  index: number
  playing: boolean
  position: number
  failed: boolean
  toggle: () => void
  next: () => void
  prev: () => void
  select: (i: number) => void
  seek: (sec: number) => void
}

function startTrack(i: number, from: number) {
  const track = TRACKS[i]
  if (!track) return
  void engine.play(track, from)
  engine.setVolume(useOS.getState().volume / 100)
}

export const usePlayer = create<PlayerState>()((set, get) => ({
  index: 0,
  playing: false,
  position: 0,
  failed: false,

  toggle: () => {
    const { playing, index, position } = get()
    if (playing) {
      engine.pause()
      set({ playing: false })
    } else {
      startTrack(index, position)
      set({ playing: true, failed: engine.failed })
    }
  },

  next: () => {
    const i = (get().index + 1) % TRACKS.length
    set({ index: i, position: 0 })
    if (get().playing) startTrack(i, 0)
  },

  prev: () => {
    const i = (get().index - 1 + TRACKS.length) % TRACKS.length
    set({ index: i, position: 0 })
    if (get().playing) startTrack(i, 0)
  },

  select: (i) => {
    set({ index: i, position: 0 })
    startTrack(i, 0)
    set({ playing: true, failed: engine.failed })
  },

  seek: (sec) => {
    engine.seek(sec)
    set({ position: sec })
  },
}))

/** Change the system volume and keep the synth engine in sync. */
export function changeVolume(v: number) {
  useOS.getState().setVolume(v)
  engine.setVolume(Math.min(1, Math.max(0, v / 100)))
}

if (typeof window !== 'undefined') {
  setInterval(() => {
    const st = usePlayer.getState()
    if (!st.playing) return
    const pos = engine.position()
    const dur = engine.duration()
    if (dur > 0 && pos >= dur - 0.05) {
      usePlayer.getState().next()
    } else {
      usePlayer.setState({ position: pos })
    }
  }, 500)
}

export function formatSec(s: number): string {
  const sec = Math.max(0, Math.floor(s))
  const m = Math.floor(sec / 60)
  const r = sec % 60
  return `${m}:${r < 10 ? '0' : ''}${r}`
}
