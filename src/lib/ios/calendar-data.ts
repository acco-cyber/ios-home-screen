'use client'

export interface CalEvent {
  id: string
  title: string
  start: string
  end?: string
  color: string
  location?: string
  allDay?: boolean
}

const EVENT_COLORS = {
  blue: '#3b82f6',
  orange: '#f97316',
  purple: '#8b5cf6',
  green: '#22c55e',
  red: '#ef4444',
  teal: '#14b8a6',
}

interface Template {
  title: string
  start: string
  end?: string
  color: keyof typeof EVENT_COLORS
  location?: string
  /** weekday: 0 = every day, 1-5 = weekdays only, 6 = sat, 7 = sun */
  days: number[]
  /** which weeks of the month (0-indexed), empty = all */
  weeks?: number[]
}

const TEMPLATES: Template[] = [
  { title: 'Team Standup', start: '09:30', end: '09:45', color: 'blue', location: 'Zoom', days: [1, 2, 3, 4, 5] },
  { title: 'Design Review', start: '14:00', end: '15:00', color: 'purple', location: 'Conference Room 2', days: [2, 4] },
  { title: 'HypothesisLab Sync', start: '11:00', end: '11:30', color: 'teal', location: 'Meet', days: [3] },
  { title: 'Lunch w/ Sam', start: '12:30', end: '13:15', color: 'orange', location: 'Café Aroma', days: [5] },
  { title: 'Yoga Class', start: '18:30', end: '19:30', color: 'green', location: 'Studio One', days: [1, 3] },
  { title: 'Dentist Appointment', start: '10:00', end: '10:45', color: 'red', days: [], weeks: [1] },
  { title: 'Grocery Run', start: '17:00', end: '18:00', color: 'orange', days: [6] },
  { title: 'Family Dinner', start: '19:00', end: '21:00', color: 'red', location: 'Nonna’s Kitchen', days: [0] },
  { title: 'Sprint Planning', start: '10:00', end: '11:30', color: 'blue', location: 'Room 4', days: [1], weeks: [0, 2] },
  { title: 'Movie Night', start: '20:30', end: '22:30', color: 'purple', days: [5] },
]

function onDay(t: Template, d: Date): boolean {
  const dow = d.getDay()
  if (t.days.length === 0) {
    // one-off: matches when weekday arbitrary — controlled by weeks only
  } else if (!t.days.includes(dow)) {
    return false
  }
  if (t.weeks && t.weeks.length > 0) {
    const weekIdx = Math.floor((d.getDate() - 1) / 7)
    if (!t.weeks.includes(weekIdx)) return false
  }
  return true
}

/** Read-only sample calendar for the given month. */
export function getMonthEvents(year: number, month: number): Map<number, CalEvent[]> {
  const days = new Date(year, month + 1, 0).getDate()
  const map = new Map<number, CalEvent[]>()
  for (let day = 1; day <= days; day++) {
    const d = new Date(year, month, day)
    const evs: CalEvent[] = []
    for (const t of TEMPLATES) {
      if (onDay(t, d)) {
        evs.push({
          id: `e-${year}-${month}-${day}-${t.title.replace(/\s+/g, '-').toLowerCase()}`,
          title: t.title,
          start: t.start,
          end: t.end,
          color: EVENT_COLORS[t.color],
          location: t.location,
        })
      }
    }
    evs.sort((a, b) => a.start.localeCompare(b.start))
    if (evs.length > 0) map.set(day, evs)
  }
  return map
}

export interface UpNext {
  event: CalEvent
  daysAway: number
  date: Date
}

/** Find the next event starting today (or in the following days). */
export function getUpNext(now: Date): UpNext | null {
  for (let offset = 0; offset < 14; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    const evs = getMonthEvents(d.getFullYear(), d.getMonth()).get(d.getDate()) ?? []
    for (const ev of evs) {
      if (offset > 0 || ev.start > formatTimeHM(now)) {
        return { event: ev, daysAway: offset, date: d }
      }
    }
  }
  return null
}

export function formatTimeHM(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  const mm = m < 10 ? `0${m}` : `${m}`
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}:${mm} ${h < 12 ? 'AM' : 'PM'}`
}
