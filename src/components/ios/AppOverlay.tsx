'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useOS } from '@/lib/ios/store'
import { APPS } from '@/lib/ios/apps'
import { PHONE_W, PHONE_H } from '@/lib/ios/types'
import { WeatherApp } from './apps/WeatherApp'
import { MusicApp } from './apps/MusicApp'
import { PhotosApp } from './apps/PhotosApp'
import { NotesApp } from './apps/NotesApp'
import { CalendarApp } from './apps/CalendarApp'
import { SettingsApp } from './apps/SettingsApp'
import { HomeBar } from './HomeBar'

function appLightChrome(app: string): boolean {
  return APPS[app as keyof typeof APPS]?.lightChrome ?? false
}

/**
 * Full-screen app container with the iOS zoom-from-icon launch animation.
 */
export function AppOverlay() {
  const openApp = useOS((s) => s.openApp)
  const launchRect = useOS((s) => s.launchRect)
  const closeApp = useOS((s) => s.closeApp)

  const r = launchRect ?? {
    x: PHONE_W / 2 - 45,
    y: PHONE_H / 2 - 45,
    width: 90,
    height: 90,
  }
  const startScale = Math.max(0.08, r.width / PHONE_W)

  return (
    <AnimatePresence>
      {openApp && (
        <motion.div
          key="app-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.12 } }}
          exit={{ opacity: 0, transition: { delay: 0.16, duration: 0.14 } }}
          className="absolute inset-0 z-[55] overflow-hidden bg-black"
        >
          <motion.div
            key={openApp}
            initial={{
              scale: startScale,
              x: r.x + r.width / 2 - PHONE_W / 2,
              y: r.y + r.height / 2 - PHONE_H / 2,
              opacity: 0.25,
              borderRadius: 54,
            }}
            animate={{ scale: 1, x: 0, y: 0, opacity: 1, borderRadius: 0 }}
            exit={{
              scale: startScale,
              x: r.x + r.width / 2 - PHONE_W / 2,
              y: r.y + r.height / 2 - PHONE_H / 2,
              opacity: 0.2,
              borderRadius: 54,
              transition: { type: 'spring', stiffness: 340, damping: 36 },
            }}
            transition={{ type: 'spring', stiffness: 330, damping: 33 }}
            className="relative overflow-hidden"
            style={{ width: PHONE_W, height: PHONE_H }}
          >
            {openApp === 'weather' && <WeatherApp />}
            {openApp === 'music' && <MusicApp />}
            {openApp === 'photos' && <PhotosApp />}
            {openApp === 'notes' && <NotesApp />}
            {openApp === 'calendar' && <CalendarApp />}
            {openApp === 'settings' && <SettingsApp />}
            <HomeBar onHome={closeApp} light={!appLightChrome(openApp)} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
