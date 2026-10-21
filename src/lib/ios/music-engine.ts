'use client'

/**
 * Tiny Web-Audio synth engine that "performs" the demo tracks live.
 * Each track is a chord progression + pentatonic melody + soft drums,
 * scheduled ahead of time on the AudioContext clock.
 */

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  cover: string
  bpm: number
  bars: number
  /** one chord (midi notes) per bar, cycled */
  chords: number[][]
  /** pentatonic-ish scale for the melody (midi) */
  scale: number[]
  lead: OscillatorType
  vibe: string
}

export const TRACKS: Track[] = [
  {
    id: 'midnight-drive',
    title: 'Midnight Drive',
    artist: 'Neon Skyline',
    album: 'Afterglow',
    cover: '/covers/midnight-drive.jpg',
    bpm: 94,
    bars: 36,
    chords: [
      [45, 52, 57, 60], // Am
      [41, 48, 53, 57], // F
      [48, 52, 55, 60], // C
      [43, 47, 50, 55], // G
    ],
    scale: [57, 60, 62, 64, 67, 69, 72, 74],
    lead: 'triangle',
    vibe: 'Synthwave · Retro',
  },
  {
    id: 'ocean-bloom',
    title: 'Ocean Bloom',
    artist: 'Marina Waves',
    album: 'Tidal Gardens',
    cover: '/covers/ocean-bloom.jpg',
    bpm: 76,
    bars: 32,
    chords: [
      [48, 52, 55, 59], // Cmaj7
      [45, 48, 52, 55], // Am7
      [41, 45, 48, 52], // Fmaj7
      [43, 47, 50, 52], // G6
    ],
    scale: [60, 62, 64, 67, 69, 71, 72, 76],
    lead: 'sine',
    vibe: 'Chill · Ambient',
  },
  {
    id: 'cloud-nine',
    title: 'Cloud Nine',
    artist: 'Pastel Fields',
    album: 'Daydream EP',
    cover: '/covers/cloud-nine.jpg',
    bpm: 84,
    bars: 32,
    chords: [
      [41, 45, 48, 52], // F
      [43, 47, 50, 55], // G
      [40, 43, 47, 52], // Em
      [45, 48, 52, 57], // Am
    ],
    scale: [59, 60, 62, 64, 67, 69, 71, 72],
    lead: 'sine',
    vibe: 'Dream Pop · Soft',
  },
  {
    id: 'rainfall',
    title: 'Rainfall',
    artist: 'Green Room',
    album: 'Window Seat',
    cover: '/covers/rainfall.jpg',
    bpm: 68,
    bars: 28,
    chords: [
      [38, 41, 45, 48], // Dm7
      [43, 47, 50, 53], // G7
      [48, 52, 55, 59], // Cmaj7
      [45, 48, 52, 55], // Am7
    ],
    scale: [62, 63, 65, 67, 69, 70, 72, 74],
    lead: 'triangle',
    vibe: 'Lo-fi · Mellow',
  },
]

const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

function mulberry(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class MusicEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  /** ctx.currentTime minus song position, i.e. song position 0 happened at this ctx time */
  private origin = 0
  /** how far into the song (seconds) has been scheduled */
  private schedPos = 0
  private track: Track | null = null
  private melodyIdx = 2
  private volume = 0.65
  playing = false
  failed = false

  private ensureCtx(): boolean {
    if (this.failed) return false
    if (this.ctx) return true
    try {
      const AC: typeof AudioContext | undefined =
        typeof window !== 'undefined'
          ? window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          : undefined
      if (!AC) {
        this.failed = true
        return false
      }
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.curve(this.volume)
      this.master.connect(this.ctx.destination)
      return true
    } catch {
      this.failed = true
      return false
    }
  }

  private curve(v: number): number {
    return 0.85 * Math.pow(Math.min(1, Math.max(0, v)), 1.35)
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v))
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.curve(this.volume), this.ctx.currentTime, 0.03)
    }
  }

  duration(): number {
    if (!this.track) return 0
    return (this.track.bars * 4 * 60) / this.track.bpm
  }

  position(): number {
    if (!this.ctx || !this.track) return 0
    const p = this.ctx.currentTime - this.origin
    return Math.min(Math.max(0, p), this.duration())
  }

  async play(track: Track, from?: number) {
    if (!this.ensureCtx() || !this.ctx || !this.master) return
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        /* ignore */
      }
    }
    const switching = this.track?.id !== track.id
    this.track = track
    const start = switching ? 0 : from ?? this.position()
    this.origin = this.ctx.currentTime + 0.08 - start
    this.schedPos = start
    this.playing = true
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => this.schedule(), 60)
    this.schedule()
  }

  pause() {
    this.playing = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    // freeze position at pause moment
    if (this.ctx) this.origin = this.ctx.currentTime - this.position()
  }

  seek(sec: number) {
    if (!this.track) return
    const clamped = Math.min(Math.max(0, sec), this.duration())
    if (this.ctx) this.origin = this.ctx.currentTime - clamped
    this.schedPos = clamped
    this.melodyIdx = 2
  }

  private schedule() {
    if (!this.ctx || !this.track || !this.playing) return
    const t = this.track
    const barLen = (4 * 60) / t.bpm
    const horizon = this.position() + 0.35
    let guard = 0
    while (this.schedPos < horizon && guard < 8) {
      const barIdx = Math.round(this.schedPos / barLen)
      this.scheduleBar(t, barIdx, this.origin + barIdx * barLen, barLen)
      this.schedPos = (barIdx + 1) * barLen
      guard++
    }
  }

  private scheduleBar(t: Track, barIdx: number, at: number, barLen: number) {
    if (!this.ctx || !this.master) return
    const beat = 60 / t.bpm
    const chord = t.chords[barIdx % t.chords.length]
    const rand = mulberry(barIdx * 7919 + t.id.length * 131)

    // pad — soft sustained chord
    for (const midi of chord) {
      this.voice({
        freq: midiToFreq(midi),
        at,
        dur: barLen * 0.98,
        type: 'sine',
        gain: 0.055,
        attack: 0.4,
        release: 0.6,
      })
    }

    // bass — root notes on beats 0 and 2 (and 3.5 sometimes)
    const bassNote = chord[0] - 12
    this.voice({ freq: midiToFreq(bassNote), at, dur: beat * 1.6, type: 'sine', gain: 0.16, attack: 0.01, release: 0.25 })
    this.voice({
      freq: midiToFreq(bassNote),
      at: at + beat * 2,
      dur: beat * 1.4,
      type: 'sine',
      gain: 0.15,
      attack: 0.01,
      release: 0.25,
    })
    if (rand() > 0.6) {
      this.voice({
        freq: midiToFreq(bassNote + 7),
        at: at + beat * 3.5,
        dur: beat * 0.5,
        type: 'sine',
        gain: 0.1,
        attack: 0.01,
        release: 0.2,
      })
    }

    // melody — seeded random walk over the scale on 8th notes
    for (let i = 0; i < 8; i++) {
      const p = rand()
      if (p < 0.45) continue
      this.melodyIdx += rand() > 0.5 ? 1 : -1
      if (this.melodyIdx < 0) this.melodyIdx = 1
      if (this.melodyIdx >= t.scale.length) this.melodyIdx = t.scale.length - 2
      const note = t.scale[this.melodyIdx]
      const at8 = at + (i * barLen) / 8
      const dur8 = barLen / 8
      this.voice({
        freq: midiToFreq(note),
        at: at8,
        dur: dur8 * (rand() > 0.7 ? 1.8 : 1),
        type: t.lead,
        gain: 0.09,
        attack: 0.015,
        release: 0.18,
      })
    }

    // drums — soft kick on 1 & 3, hat on off-beats
    this.kick(at)
    this.kick(at + beat * 2)
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 1) this.hat(at + (i * barLen) / 8, rand() > 0.8 ? 0.05 : 0.028)
    }
  }

  private voice(o: {
    freq: number
    at: number
    dur: number
    type: OscillatorType
    gain: number
    attack: number
    release: number
  }) {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master) return
    try {
      const osc = ctx.createOscillator()
      osc.type = o.type
      osc.frequency.value = o.freq
      const g = ctx.createGain()
      const t0 = Math.max(o.at, ctx.currentTime + 0.005)
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(o.gain, t0 + o.attack)
      g.gain.setValueAtTime(o.gain, Math.max(t0 + o.attack, o.at + o.dur - o.release))
      g.gain.exponentialRampToValueAtTime(0.0001, o.at + o.dur)
      osc.connect(g)
      g.connect(master)
      osc.start(t0)
      osc.stop(o.at + o.dur + 0.05)
      osc.onended = () => {
        try {
          g.disconnect()
        } catch {
          /* noop */
        }
      }
    } catch {
      /* noop */
    }
  }

  private kick(at: number) {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master) return
    try {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      const g = ctx.createGain()
      const t0 = Math.max(at, ctx.currentTime + 0.005)
      osc.frequency.setValueAtTime(120, t0)
      osc.frequency.exponentialRampToValueAtTime(44, t0 + 0.14)
      g.gain.setValueAtTime(0.32, t0)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16)
      osc.connect(g)
      g.connect(master)
      osc.start(t0)
      osc.stop(t0 + 0.2)
      osc.onended = () => {
        try {
          g.disconnect()
        } catch {
          /* noop */
        }
      }
    } catch {
      /* noop */
    }
  }

  private hat(at: number, gain: number) {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master) return
    try {
      const len = 0.06
      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 7000
      const g = ctx.createGain()
      g.gain.value = gain
      src.connect(hp)
      hp.connect(g)
      g.connect(master)
      src.start(at)
      src.onended = () => {
        try {
          g.disconnect()
        } catch {
          /* noop */
        }
      }
    } catch {
      /* noop */
    }
  }
}

export const engine = new MusicEngine()
