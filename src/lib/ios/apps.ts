'use client'

import { CalendarDays, CloudSun, Images, Music2, NotebookPen, Settings2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppId } from './types'

export interface AppDef {
  id: AppId
  name: string
  /** tailwind gradient classes for the icon background */
  gradient: string
  icon: LucideIcon
  /** status bar text should be dark when this app is open */
  lightChrome?: boolean
}

export const APPS: Record<AppId, AppDef> = {
  weather: {
    id: 'weather',
    name: 'Weather',
    gradient: 'bg-gradient-to-b from-sky-400 to-blue-600',
    icon: CloudSun,
    lightChrome: false,
  },
  music: {
    id: 'music',
    name: 'Music',
    gradient: 'bg-gradient-to-b from-rose-500 to-red-600',
    icon: Music2,
    lightChrome: false,
  },
  photos: {
    id: 'photos',
    name: 'Photos',
    gradient: 'bg-white',
    icon: Images,
    lightChrome: false,
  },
  notes: {
    id: 'notes',
    name: 'Notes',
    gradient: 'bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500',
    icon: NotebookPen,
    lightChrome: true,
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    gradient: 'bg-white',
    icon: CalendarDays,
    lightChrome: true,
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    gradient: 'bg-gradient-to-b from-zinc-400 to-zinc-600',
    icon: Settings2,
    lightChrome: true,
  },
}

export const APP_LIST: AppDef[] = Object.values(APPS)

export const WALLPAPERS: Record<string, { src: string; label: string }> = {
  light: { src: '/wallpapers/light.jpg', label: 'Silk Light' },
  dark: { src: '/wallpapers/dark.jpg', label: 'Midnight Silk' },
  sunset: { src: '/wallpapers/sunset.jpg', label: 'Alpine Dusk' },
}
