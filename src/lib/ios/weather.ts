'use client'

export type Condition = 'sun' | 'partly' | 'cloud' | 'rain' | 'storm' | 'snow'

export interface HourPoint {
  label: string
  temp: number
  cond: Condition
}

export interface DayForecast {
  name: string
  hi: number
  lo: number
  cond: Condition
  pop: number
}

export interface WeatherSnapshot {
  city: string
  temp: number
  cond: Condition
  feels: number
  humidity: number
  wind: number
  uv: number
  hi: number
  lo: number
  hourly: HourPoint[]
  week: DayForecast[]
  updatedAt: number
}

const CONDITION_LABEL: Record<Condition, string> = {
  sun: 'Sunny',
  partly: 'Partly Cloudy',
  cloud: 'Cloudy',
  rain: 'Rain',
  storm: 'Thunderstorms',
  snow: 'Snow',
}

export function conditionLabel(c: Condition): string {
  return CONDITION_LABEL[c]
}

/** Small deterministic hash → seeded pseudo random in [0,1). */
function seeded(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function condFromRain(rain: number, night: boolean): Condition {
  if (rain > 0.82) return 'storm'
  if (rain > 0.55) return 'rain'
  if (rain > 0.35) return 'cloud'
  if (rain > 0.18) return 'partly'
  return night ? 'partly' : 'sun'
}

/**
 * Deterministic simulated weather for Cupertino.
 * `tick` changes slowly over time so widgets can visibly refresh.
 */
export function getWeather(now: Date, tick: number): WeatherSnapshot {
  const dayMs = 86400000
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const minutes = (now.getTime() - midnight) / 60000
  // temperature curve: coldest ~5am, warmest ~3pm
  const dayPhase = Math.sin(((minutes - 300) / (24 * 60)) * Math.PI * 2)
  const dayIdx = Math.floor(midnight / dayMs)
  const rnd = seeded(dayIdx * 7919 + 13)
  const base = 18 + rnd() * 6
  const jitter = Math.sin(tick * 0.7) * 0.4
  const temp = Math.round((base + dayPhase * 7 + jitter) * 10) / 10

  const hour = now.getHours()
  const night = hour < 6 || hour >= 20

  const hourly: HourPoint[] = []
  for (let i = 0; i < 10; i++) {
    const t = new Date(now.getTime() + i * 3600000)
    const h = t.getHours()
    const hPhase = Math.sin(((h * 60 - 300) / 1440) * Math.PI * 2)
    const r = seeded(dayIdx * 31 + h + 7)
    const rain = r()
    const tTemp = Math.round((base + hPhase * 7 + (r() - 0.5) * 1.6) * 10) / 10
    const hNight = h < 6 || h >= 20
    hourly.push({
      label: i === 0 ? 'Now' : `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'AM' : 'PM'}`,
      temp: tTemp,
      cond: condFromRain(rain, hNight),
    })
  }

  const week: DayForecast[] = []
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * dayMs)
    const r = seeded((Math.floor(d.getTime() / dayMs)) * 104729 + 11)
    const hi = Math.round(base + 5 + r() * 6)
    const lo = Math.round(base - 4 + r() * 3)
    week.push({
      name: i === 0 ? 'Today' : names[d.getDay()],
      hi,
      lo,
      cond: condFromRain(r(), false),
      pop: Math.round(r() * 100),
    })
  }

  const rNow = seeded(dayIdx * 977 + hour)
  return {
    city: 'Cupertino',
    temp,
    cond: condFromRain(rNow(), night),
    feels: Math.round(temp + (night ? -1 : 2)),
    humidity: Math.round(48 + rNow() * 35),
    wind: Math.round(6 + rNow() * 18),
    uv: night ? 0 : Math.round(2 + rNow() * 8),
    hi: week[0].hi,
    lo: week[0].lo,
    hourly,
    week,
    updatedAt: Date.now(),
  }
}
