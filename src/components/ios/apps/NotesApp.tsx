'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, NotebookPen, Plus, Trash2 } from 'lucide-react'
import { useLocalStorage } from '@/lib/ios/hooks'
import { cx } from '@/lib/ios/hooks'

interface Note {
  id: string
  title: string
  body: string
  updatedAt: number
}

const STORAGE_KEY = 'ios-notes-v1'

const SEED: Note[] = [
  {
    id: 'n1',
    title: 'Welcome to Notes',
    body:
      'Everything you type here is saved to your browser\'s localStorage — close the app, refresh the page, and your notes will still be here.\n\nTry creating a note with the + button.',
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'n2',
    title: 'Grocery List',
    body: '• Oat milk\n• Sourdough bread\n• Blueberries\n• Coffee beans (dark roast)\n• Olive oil',
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'n3',
    title: 'Book Ideas',
    body: '1. "Thinking in Systems" — Donella Meadows\n2. "The Making of Prince of Persia"\n3. "Creative Selection"',
    updatedAt: Date.now() - 3600000 * 5,
  },
]

function relDate(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const isSameDay = d.toDateString() === today.toDateString()
  if (isSameDay) {
    const h = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12
    const m = d.getMinutes()
    return `Today ${h}:${m < 10 ? '0' : ''}${m}`
  }
  const yesterday = new Date(today.getTime() - 86400000)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export function NotesApp() {
  const [notes, setNotes] = useLocalStorage<Note[]>(STORAGE_KEY, SEED)
  const [openId, setOpenId] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)
  const open = notes.find((n) => n.id === openId) ?? null

  const flashSaved = () => {
    setSavedFlash(true)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setSavedFlash(false), 1200)
  }

  const updateOpen = (patch: Partial<Note>) => {
    if (!openId) return
    setNotes((prev) => prev.map((n) => (n.id === openId ? { ...n, ...patch, updatedAt: Date.now() } : n)))
    flashSaved()
  }

  const createNote = () => {
    const id = `n-${Date.now()}`
    setNotes((prev) => [{ id, title: '', body: '', updatedAt: Date.now() }, ...prev])
    setOpenId(id)
  }

  const removeNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setOpenId(null)
  }

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [])

  /* ------------------------------ editor view ------------------------------ */
  if (open) {
    return (
      <div className="absolute inset-0 bg-[#f6f5f0] text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between px-3 pt-[58px]">
          <button
            type="button"
            onClick={() => setOpenId(null)}
            aria-label="Back to notes list"
            className="flex items-center gap-0.5 py-2 text-[16px] text-amber-600 dark:text-amber-400 active:opacity-60"
          >
            <ArrowLeft size={20} />
            Notes
          </button>
          <div className="flex items-center gap-1">
            <span
              className={cx(
                'flex items-center gap-1 text-[11px] font-medium text-zinc-400 transition-opacity duration-300',
                savedFlash ? 'opacity-100' : 'opacity-0',
              )}
            >
              <Check size={12} /> Saved
            </span>
            <button
              type="button"
              onClick={() => removeNote(open.id)}
              aria-label="Delete note"
              className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 active:bg-black/5 dark:active:bg-white/10"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(100%-58px)] flex-col px-5 pb-10">
          <input
            value={open.title}
            onChange={(e) => updateOpen({ title: e.target.value })}
            placeholder="Title"
            className="w-full border-b border-transparent bg-transparent pb-2 text-[26px] font-bold outline-none placeholder:text-zinc-300 focus:border-amber-300 dark:placeholder:text-zinc-600"
            aria-label="Note title"
          />
          <div className="mt-1 text-[11px] text-zinc-400">Edited {relDate(open.updatedAt)} · synced to localStorage</div>
          <textarea
            value={open.body}
            onChange={(e) => updateOpen({ body: e.target.value })}
            placeholder="Start typing…"
            className="mt-3 w-full flex-1 resize-none bg-transparent text-[16px] leading-relaxed outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
            aria-label="Note body"
          />
        </div>
      </div>
    )
  }

  /* ------------------------------- list view ------------------------------- */
  return (
    <div className="absolute inset-0 bg-[#f6f5f0] text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-16 pt-[64px] ios-scrollable">
        <header className="flex items-end justify-between px-5">
          <div>
            <h1 className="text-[32px] font-bold leading-tight">Notes</h1>
            <p className="text-[13px] text-zinc-400">{notes.length} notes · synced locally</p>
          </div>
          <button
            type="button"
            onClick={createNote}
            aria-label="New note"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-zinc-900 shadow-md active:scale-90"
          >
            <Plus size={22} strokeWidth={2.6} />
          </button>
        </header>

        <div className="mx-4 mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10">
          {sorted.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-14 text-zinc-400">
              <NotebookPen size={28} />
              <span className="text-[14px]">No notes yet — tap + to write one</span>
            </div>
          )}
          {sorted.map((n, i) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setOpenId(n.id)}
              className={cx(
                'block w-full px-4 py-3 text-left active:bg-amber-50 dark:active:bg-zinc-700/60',
                i !== sorted.length - 1 && 'border-b border-zinc-100 dark:border-zinc-700',
              )}
            >
              <div className="truncate text-[15.5px] font-semibold">{n.title || 'New Note'}</div>
              <div className="mt-0.5 flex gap-2 text-[12.5px] text-zinc-400">
                <span className="shrink-0">{relDate(n.updatedAt)}</span>
                <span className="truncate text-zinc-500 dark:text-zinc-400">
                  {n.body.trimStart().split('\n')[0] || 'No additional text'}
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-5 text-center text-[11px] text-zinc-400">
          Notes persist in your browser via localStorage
        </p>
      </div>
    </div>
  )
}
