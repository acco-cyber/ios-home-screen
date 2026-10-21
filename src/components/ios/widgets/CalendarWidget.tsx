'use client'

import { useMemo } from 'react'
import { getUpNext } from '@/lib/ios/calendar-data'
import { useNow, usePulse, cx } from '@/lib/ios/hooks'
import { useOS } from '@/lib/ios/store'

export function CalendarWidget({ className }: { className?: string }) {
  const now = useNow(30000)
  const launch = useOS((s) => s.launch)
  const upNext = useMemo(() => getUpNext(now), [now])
  const pulse = usePulse(upNext?.event.id ?? 'none')

  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

  const whenLabel = upNext
    ? upNext.daysAway === 0
      ? `Today · ${upNext.event.start}`
      : upNext.daysAway === 1
        ? 'Tomorrow'
        : `${upNext.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
    : 'No events'

  return (
    <button
      type="button"
      data-launch="calendar"
      onClick={() => launch('calendar')}
      className={cx(
        'relative col-span-2 flex h-[158px] flex-col rounded-[26px] bg-white p-3.5 text-left text-zinc-900 shadow-[0_10px_24px_rgba(0,0,0,0.3)] ring-1 ring-black/5 transition-transform duration-150 active:scale-[0.96] dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10',
        pulse && 'widget-pulse',
        className,
      )}
      aria-label="Calendar widget"
    >
      <div className="text-[11px] font-bold tracking-wide text-red-500">{dayNames[now.getDay()]}</div>
      <div className="-mt-0.5 text-[34px] font-light leading-tight text-zinc-900 dark:text-zinc-100">{now.getDate()}</div>
      <div className="mt-1 h-px w-full bg-zinc-200 dark:bg-zinc-600" />
      {upNext ? (
        <div className="mt-2.5 space-y-2 overflow-hidden">
          <div className="flex items-start gap-2">
            <div className="mt-[3px] h-8 w-[3px] shrink-0 rounded-full" style={{ background: upNext.event.color }} />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{upNext.event.title}</div>
              <div className="text-[11px] text-zinc-500">
                {whenLabel}
                {upNext.daysAway === 0 ? ` · ${upNext.event.start}` : ''}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-[13px] text-zinc-400 dark:text-zinc-500">Your calendar is clear ✨</div>
      )}
      <div className="mt-auto text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Calendar</div>
    </button>
  )
}
