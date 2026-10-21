'use client'

import { useMemo } from 'react'
import { getWeather, conditionLabel } from '@/lib/ios/weather'
import { useNow, usePulse, cx } from '@/lib/ios/hooks'
import { useOS } from '@/lib/ios/store'
import { WeatherGlyph } from './WeatherGlyph'

export function WeatherWidget({ className }: { className?: string }) {
  const now = useNow(30000)
  const launch = useOS((s) => s.launch)
  const [tickPart, tick] = useMemo(() => [Math.floor(now.getTime() / 30000), Math.floor(now.getTime() / 30000)], [now])
  void tickPart
  const weather = useMemo(() => getWeather(now, tick), [now, tick])
  const pulse = usePulse(Math.round(weather.temp * 2))

  return (
    <button
      type="button"
      data-launch="weather"
      onClick={() => launch('weather')}
      className={cx(
        'widget-pulse-target relative col-span-2 flex h-[158px] flex-col justify-between overflow-hidden rounded-[26px] bg-gradient-to-b from-sky-500 to-blue-700 p-3.5 text-left text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)] ring-1 ring-white/20 transition-transform duration-150 active:scale-[0.96]',
        pulse && 'widget-pulse',
        className,
      )}
      aria-label={`Weather widget: ${weather.temp} degrees, ${conditionLabel(weather.cond)}`}
    >
      <WeatherGlyph cond={weather.cond} className="absolute -right-3 -top-3 opacity-25" size={110} />
      <div className="relative">
        <div className="text-[13px] font-semibold">Cupertino</div>
        <div className="mt-0.5 flex items-start">
          <span className="text-[40px] font-light leading-none tracking-tight">{Math.round(weather.temp)}</span>
          <span className="mt-1 text-[17px] font-normal">°</span>
        </div>
        <div className="text-[12px] font-medium">{conditionLabel(weather.cond)}</div>
        <div className="text-[12px] text-white/85">
          H:{weather.hi}° L:{weather.lo}°
        </div>
      </div>
      <div className="relative flex items-center justify-between text-[11px] text-white/90">
        <div className="flex flex-1 justify-between pr-1">
          {weather.hourly.slice(1, 4).map((h) => (
            <div key={h.label} className="flex flex-col items-center gap-[3px]">
              <span>{h.label}</span>
              <WeatherGlyph cond={h.cond} size={15} />
              <span className="font-semibold">{Math.round(h.temp)}°</span>
            </div>
          ))}
        </div>
      </div>
    </button>
  )
}

export function widgetCondLabel(c: Condition) {
  return conditionLabel(c)
}
