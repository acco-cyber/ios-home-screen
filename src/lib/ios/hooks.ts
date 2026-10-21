'use client'

import { useEffect, useState } from 'react'

/**
 * Returns true briefly whenever `value` changes — used for the
 * "widget refreshed" pulse animation.
 */
export function usePulse(value: unknown, ms = 900): boolean {
  const [state, setState] = useState<{ v: unknown; pulse: boolean }>({ v: value, pulse: false })

  // adjust state during render when the tracked value changes (React-approved pattern)
  if (state.v !== value) {
    setState({ v: value, pulse: true })
  }

  useEffect(() => {
    if (!state.pulse) return
    const t = setTimeout(() => setState((s) => ({ ...s, pulse: false })), ms)
    return () => clearTimeout(t)
  }, [state.pulse, ms])

  return state.pulse
}

/** Live clock string like iOS ("9:41"). */
export function useClock(intervalMs = 10000): string {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const update = () => setNow(new Date())
    update()
    const t = setInterval(update, intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  if (!now) return ''
  const h = now.getHours() % 12 === 0 ? 12 : now.getHours() % 12
  const m = now.getMinutes()
  return `${h}:${m < 10 ? '0' : ''}${m}`
}

/** Ticking Date that refreshes on an interval (for weather / calendar). */
export function useNow(intervalMs = 30000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

/** localStorage-backed state with lazy SSR-safe init. */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  const update = (v: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }
  return [value, update]
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
