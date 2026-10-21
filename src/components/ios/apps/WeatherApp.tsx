'use client'

import { useMemo } from 'react'
import { Droplets, Eye, Wind } from 'lucide-react'
import { getWeather, conditionLabel } from '@/lib/ios/weather'
import { useNow } from '@/lib/ios/hooks'
import { WeatherGlyph } from '../widgets/WeatherGlyph'
import { cx } from '@/lib/ios/hooks'

function bgFor(cond: string, night: boolean): string {
  if (night) return 'bg-gradient-to-b from-zinc-900 via-slate-900 to-slate-800'
  switch (cond) {
    case 'sun':
      return 'bg-gradient-to-b from-sky-500 via-sky-600 to-blue-800'
    case 'partly':
      return 'bg-gradient-to-b from-slate-500 via-slate-600 to-slate-800'
    case 'cloud':
      return 'bg-gradient-to-b from-zinc-500 via-zinc-600 to-zinc-800'
    case 'rain':
      return 'bg-gradient-to-b from-slate-600 via-slate-700 to-zinc-900'
    case 'storm':
      return 'bg-gradient-to-b from-zinc-800 via-zinc-800 to-zinc-950'
    default:
      return 'bg-gradient-to-b from-sky-500 to-blue-800'
  }
}

export function WeatherApp() {
  const now = useNow(30000)
  const tick = Math.floor(now.getTime() / 30000)
  const weather = useMemo(() => getWeather(now, tick), [now, tick])
  const hour = now.getHours()
  const night = hour < 6 || hour >= 20

  const gMin = Math.min(...weather.week.map((d) => d.lo))
  const gMax = Math.max(...weather.week.map((d) => d.hi))

  return (
    <div className={cx('absolute inset-0 text-white', bgFor(weather.cond, night))}>
      <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-16 pt-[66px] ios-scrollable">
        <header className="flex flex-col items-center">
          <h1 className="text-[30px] font-normal">Cupertino</h1>
          <div className="flex items-start">
            <span className="text-[86px] font-thin leading-none tracking-tighter">{Math.round(weather.temp)}</span>
            <span className="mt-4 text-[36px] font-light">°</span>
          </div>
          <div className="text-[17px] font-medium text-white/85">{conditionLabel(weather.cond)}</div>
          <div className="text-[16px] font-medium text-white/75">
            H:{weather.hi}° L:{weather.lo}°
          </div>
        </header>

        {/* hourly */}
        <section className="glass mx-4 mt-6 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
          <div className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-white/60">
            Hourly Forecast
          </div>
          <div className="no-scrollbar flex gap-1 overflow-x-auto pb-1">
            {weather.hourly.map((h, i) => (
              <div
                key={`${h.label}-${i}`}
                className={cx(
                  'flex min-w-[54px] flex-col items-center gap-1.5 rounded-xl px-2 py-1.5',
                  i === 0 && 'bg-white/15',
                )}
              >
                <span className="text-[12px] font-semibold">{h.label}</span>
                <WeatherGlyph cond={h.cond} size={22} />
                <span className="text-[15px] font-medium">{Math.round(h.temp)}°</span>
              </div>
            ))}
          </div>
        </section>

        {/* 7-day */}
        <section className="glass mx-4 mt-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-white/60">7-Day Forecast</div>
          {weather.week.map((d, i) => (
            <div key={d.name} className="flex items-center gap-3 border-b border-white/10 py-2.5 last:border-0">
              <span className="w-[52px] text-[15px] font-medium">{d.name}</span>
              <WeatherGlyph cond={d.cond} size={20} />
              <span className="w-[34px] text-right text-[14px] text-white/65">{d.lo}°</span>
              <div className="relative h-[4px] flex-1 rounded-full bg-white/20">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-teal-300 via-amber-300 to-orange-400"
                  style={{
                    left: `${((d.lo - gMin) / (gMax - gMin)) * 100}%`,
                    width: `${((d.hi - d.lo) / (gMax - gMin)) * 100}%`,
                  }}
                />
              </div>
              <span className="w-[34px] text-[14px] font-medium">{d.hi}°</span>
              <span className="hidden w-[40px] text-right text-[12px] text-sky-200 sm:block">{d.pop}%</span>
            </div>
          ))}
        </section>

        {/* details */}
        <section className="mx-4 mt-3 grid grid-cols-3 gap-3">
          <DetailCard label="Feels Like" value={`${weather.feels}°`} icon={<span className="text-[15px]">🌡️</span>} />
          <DetailCard label="Humidity" value={`${weather.humidity}%`} icon={<Droplets size={15} />} />
          <DetailCard label="Wind" value={`${weather.wind} km/h`} icon={<Wind size={15} />} />
          <DetailCard label="UV Index" value={`${weather.uv}`} icon={<span className="text-[15px]">🔆</span>} />
          <DetailCard label="Rain Chance" value={`${weather.week[0].pop}%`} icon={<Droplets size={15} />} />
          <DetailCard label="Visibility" value="16 km" icon={<Eye size={15} />} />
        </section>

        <footer className="mt-6 text-center text-[11px] text-white/50">
          Simulated forecast · updates live · tap status bar time to close
        </footer>
      </div>
    </div>
  )
}

function DetailCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-white/60">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-[19px] font-medium">{value}</div>
    </div>
  )
}
