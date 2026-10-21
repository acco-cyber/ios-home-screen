'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { getMonthEvents, type CalEvent } from '@/lib/ios/calendar-data'
import { cx } from '@/lib/ios/hooks'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function CalendarApp() {
  const today = new Date()
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [selected, setSelected] = useState(() => today.getDate())

  const eventsByDay = useMemo(() => getMonthEvents(view.y, view.m), [view])
  const firstDow = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()

  const isToday = (d: number) =>
    d === today.getDate() && view.m === today.getMonth() && view.y === today.getFullYear()

  const moveMonth = (delta: number) => {
    const m = view.m + delta
    const y = view.y + Math.floor(m / 12)
    setView({ y, m: ((m % 12) + 12) % 12 })
    setSelected(1)
  }

  const selectedEvents: CalEvent[] = eventsByDay.get(selected) ?? []
  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="absolute inset-0 bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-16 pt-[64px] ios-scrollable">
        <header className="flex items-end justify-between px-5">
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-wide text-red-500">
              {today.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <h1 className="text-[30px] font-bold leading-tight">{monthLabel}</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 active:bg-black/5 dark:active:bg-white/10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 active:bg-black/5 dark:active:bg-white/10"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        <div className="mt-3 grid grid-cols-7 gap-y-1 px-3 text-center text-[11px] font-semibold text-zinc-400">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1.5 px-3 pt-1.5">
          {Array.from({ length: firstDow }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const evs = eventsByDay.get(day)
            const isSel = day === selected
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelected(day)}
                className="flex flex-col items-center py-0.5"
                aria-label={`${monthLabel} ${day}`}
              >
                <span
                  className={cx(
                    'flex h-[34px] w-[34px] items-center justify-center rounded-full text-[16px]',
                    isToday(day) && !isSel && 'text-red-500 font-bold',
                    isSel && 'bg-zinc-900 font-bold text-white dark:bg-white dark:text-zinc-900',
                  )}
                >
                  {day}
                </span>
                <span className="mt-[1px] flex h-[5px] gap-[2px]">
                  {(evs ?? []).slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className="h-[5px] w-[5px] rounded-full"
                      style={{ background: isSel ? '#ffffffcc' : ev.color }}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between px-5">
          <h2 className="text-[17px] font-bold">
            {new Date(view.y, view.m, selected).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h2>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">
            Read-only sample
          </span>
        </div>

        <div className="mx-4 mt-3 overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10">
          {selectedEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-zinc-400">
              <CalendarDays size={26} />
              <span className="text-[13.5px]">No events</span>
            </div>
          ) : (
            selectedEvents.map((ev, i) => (
              <div
                key={ev.id}
                className={cx('flex items-stretch gap-3 px-4 py-3', i !== selectedEvents.length - 1 && 'border-b border-zinc-200/70 dark:border-zinc-700')}
              >
                <div className="w-[3px] shrink-0 rounded-full" style={{ background: ev.color }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">{ev.title}</div>
                  <div className="text-[12.5px] text-zinc-500 dark:text-zinc-400">
                    {ev.start}
                    {ev.end ? ` – ${ev.end}` : ''}
                  </div>
                  {ev.location && (
                    <div className="mt-0.5 flex items-center gap-1 text-[12px] text-zinc-400">
                      <MapPin size={11} />
                      {ev.location}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <p className="mt-4 px-5 text-center text-[11px] text-zinc-400">
          Sample calendar data — events regenerate around the current date
        </p>
      </div>
    </div>
  )
}
