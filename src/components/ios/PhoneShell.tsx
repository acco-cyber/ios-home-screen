'use client'

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOS } from '@/lib/ios/store'
import { PHONE_H, PHONE_W, type LaunchRect } from '@/lib/ios/types'
import { StatusBar } from './StatusBar'
import { DynamicIsland } from './DynamicIsland'
import { HomeScreen, PhoneContext } from './HomeScreen'
import { AppOverlay } from './AppOverlay'
import { NotificationCenter } from './NotificationCenter'
import { ControlCenter } from './ControlCenter'
import { cx } from '@/lib/ios/hooks'

function useSystemDark(): boolean {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setDark(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return dark
}

const emptySubscribe = () => () => undefined
/** True only after client hydration — avoids SSR/localStorage mismatches. */
function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

function BootScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black"
    >
      <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-zinc-200 to-zinc-500 opacity-90 shadow-[0_0_60px_rgba(255,255,255,0.25)]" />
      <div className="mt-8 h-[5px] w-36 overflow-hidden rounded-full bg-white/15">
        <div className="boot-bar h-full rounded-full bg-white/85" />
      </div>
    </motion.div>
  )
}

export function PhoneShell() {
  const mounted = useMounted()
  const [booted, setBooted] = useState(false)
  const [scale, setScale] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const phoneRef = useRef<HTMLDivElement>(null)
  const systemDark = useSystemDark()

  const theme = useOS((s) => s.theme)
  const openApp = useOS((s) => s.openApp)
  const notifOpen = useOS((s) => s.notifOpen)
  const controlOpen = useOS((s) => s.controlOpen)
  const brightness = useOS((s) => s.brightness)
  const flashlight = useOS((s) => s.flashlight)
  const setNotifOpen = useOS((s) => s.setNotifOpen)
  const setControlOpen = useOS((s) => s.setControlOpen)
  const closeApp = useOS((s) => s.closeApp)
  const tickBattery = useOS((s) => s.tickBattery)

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1400)
    const bt = setInterval(() => tickBattery(), 90000)
    return () => {
      clearTimeout(t)
      clearInterval(bt)
    }
  }, [tickBattery])

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const mobile = vw < 520
      setIsMobile(mobile)
      if (mobile) setScale(Math.min(vw / PHONE_W, vh / PHONE_H))
      else setScale(Math.min((vh * 0.9) / PHONE_H, (vw * 0.86) / PHONE_W, 1))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  const getLaunchRect = useCallback(
    (el: Element): LaunchRect => {
      const pr = phoneRef.current?.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      if (!pr) return { x: 0, y: 0, width: r.width, height: r.height }
      return {
        x: (r.left - pr.left) / scale,
        y: (r.top - pr.top) / scale,
        width: r.width / scale,
        height: r.height / scale,
      }
    },
    [scale],
  )

  /* --- edge gesture strips (Notification / Control Center + home) --- */
  const strip = useRef<{ y0: number | null; fired: boolean }>({ y0: null, fired: false })

  const topHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      strip.current = { y0: e.clientY, fired: false }
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (strip.current.y0 === null || strip.current.fired) return
      if (e.clientY - strip.current.y0 > 90) {
        strip.current.fired = true
        setNotifOpen(true)
      }
    },
    onPointerUp: (e: React.PointerEvent) => {
      const dy = strip.current.y0 !== null ? e.clientY - strip.current.y0 : 0
      const fired = strip.current.fired
      strip.current.y0 = null
      strip.current.fired = false
      if (!fired && dy > 22) setNotifOpen(true)
    },
  }

  const bottomHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      strip.current = { y0: e.clientY, fired: false }
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (strip.current.y0 === null || strip.current.fired) return
      if (strip.current.y0 - e.clientY > 90) {
        strip.current.fired = true
        if (useOS.getState().openApp) closeApp()
        else setControlOpen(true)
      }
    },
    onPointerUp: (e: React.PointerEvent) => {
      const dy = strip.current.y0 !== null ? strip.current.y0 - e.clientY : 0
      const fired = strip.current.fired
      strip.current.y0 = null
      strip.current.fired = false
      if (!fired && dy > 24) {
        if (useOS.getState().openApp) closeApp()
        else setControlOpen(true)
      }
    },
  }

  const dark = theme === 'dark' || (theme === 'auto' && systemDark)

  const screen = (
    <div
      ref={phoneRef}
      className={cx('ios-scope relative overflow-hidden bg-black', dark && 'dark', isMobile ? '' : 'rounded-[54px]')}
      style={{ width: PHONE_W, height: PHONE_H }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* home screen (includes wallpaper; zooms back when an app opens) */}
      <motion.div
        className="absolute inset-0"
        animate={{ scale: openApp ? 0.92 : 1, opacity: openApp ? 0.35 : 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      >
        <HomeScreen />
      </motion.div>

      {/* status bar + Dynamic Island live above apps */}
      <div className="pointer-events-none absolute inset-0 z-[60]">
        <div className="pointer-events-auto">
          <StatusBar />
        </div>
        <div className="pointer-events-auto">
          <DynamicIsland />
        </div>
      </div>

      {/* app overlay with zoom-launch animation */}
      <AppOverlay />

      {/* home indicator (home screen only — apps render their own) */}
      {!openApp && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center pb-[7px]">
          <div className="h-[5px] w-[134px] rounded-full bg-white/90 shadow" />
        </div>
      )}

      {/* gesture strips */}
      {!notifOpen && !controlOpen && (
        <>
          <div aria-hidden className="absolute inset-x-0 top-0 z-[58] h-[46px] touch-none" {...topHandlers} />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 z-[58] h-[30px] touch-none"
            {...bottomHandlers}
          />
        </>
      )}

      {/* panels */}
      <AnimatePresence>{notifOpen && <NotificationCenter />}</AnimatePresence>
      <AnimatePresence>{controlOpen && <ControlCenter />}</AnimatePresence>

      {/* flashlight glow */}
      {flashlight && <div className="pointer-events-none absolute inset-0 z-[75] bg-white/70" />}

      {/* brightness dimmer */}
      <div
        className="pointer-events-none absolute inset-0 z-[90] bg-black transition-opacity duration-200"
        style={{ opacity: ((100 - brightness) / 100) * 0.75 }}
      />

      <AnimatePresence>{!booted && <BootScreen />}</AnimatePresence>
    </div>
  )

  if (!mounted) {
    return <div className="min-h-screen w-full bg-zinc-950" />
  }

  return (
    <PhoneContext.Provider value={{ scale, getLaunchRect }}>
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-zinc-950">
        {/* ambient desktop backdrop */}
        {!isMobile && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,113,108,0.16),transparent_62%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-4 text-center">
              <p className="text-[12px] font-medium tracking-wide text-zinc-600">
                Long-press icons to rearrange · swipe pages · pull down for notifications · pull up for Control Center
              </p>
            </div>
          </>
        )}

        {/* sized wrapper keeps layout correct while inner content is scaled */}
        <div className="relative" style={{ width: PHONE_W * scale, height: PHONE_H * scale }}>
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ transform: `scale(${scale})`, width: PHONE_W, height: PHONE_H }}
          >
            <div
              className={cx(
                'bg-black',
                isMobile
                  ? ''
                  : 'rounded-[64px] p-[11px] shadow-[0_50px_120px_-20px_rgba(0,0,0,0.9)] ring-1 ring-zinc-800',
              )}
            >
              {screen}
            </div>
          </div>
        </div>
      </div>
    </PhoneContext.Provider>
  )
}
