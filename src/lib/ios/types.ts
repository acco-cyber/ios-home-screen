export type AppId = 'weather' | 'music' | 'photos' | 'notes' | 'calendar' | 'settings'

export type ThemeMode = 'light' | 'dark' | 'auto'

export type WallpaperId = 'light' | 'dark' | 'sunset'

export interface LaunchRect {
  x: number
  y: number
  width: number
  height: number
}

export interface NotifItem {
  id: string
  app: AppId
  title: string
  body: string
  time: string
}

/** Design-space dimensions of the phone screen (un-scaled px). */
export const PHONE_W = 390
export const PHONE_H = 844
