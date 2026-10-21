'use client'

import { Cloud, CloudRain, CloudLightning, Cloudy, Snowflake, Sun } from 'lucide-react'
import type { Condition } from '@/lib/ios/weather'

export function WeatherGlyph({ cond, size = 20, className }: { cond: Condition; size?: number; className?: string }) {
  switch (cond) {
    case 'sun':
      return <Sun size={size} className={className} strokeWidth={1.8} />
    case 'partly':
      return <Cloud size={size} className={className} strokeWidth={1.8} />
    case 'cloud':
      return <Cloudy size={size} className={className} strokeWidth={1.8} />
    case 'rain':
      return <CloudRain size={size} className={className} strokeWidth={1.8} />
    case 'storm':
      return <CloudLightning size={size} className={className} strokeWidth={1.8} />
    case 'snow':
      return <Snowflake size={size} className={className} strokeWidth={1.8} />
    default:
      return <Sun size={size} className={className} strokeWidth={1.8} />
  }
}
