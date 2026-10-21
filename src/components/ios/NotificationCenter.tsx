'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useOS } from '@/lib/ios/store'
import { APPS } from '@/lib/ios/apps'
import { TRACKS } from '@/lib/ios/music-engine'
import { usePlayer } from '@/lib/ios/player-store'
import { useClock } from '@/lib/ios/hooks'

export function NotificationCenter() {
  const notifs = useOS((s) => s.notifs)
  const dismiss = useOS((s) => s.dismissNotif)
  const clear = useOS((s) => s.clearNotifs)
  const close = useOS((s) => s.setNotifOpen)
  const launch = useOS((s) => s.launch)
  const time = useClock()
  const now = new Date()

  const dateLine = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const playing = usePlayer((s) => s.playing)
  const trackIndex = usePlayer((s) => s.index)
  const track = TRACKS[trackIndex]

  return (
    <motion.div
      className="absolute inset-0 z-[70]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <button
        type="button"
        aria-label="Close Notification Center"
        onClick={() => close(false)}
        className="absolute inset-0 bg-black/25"
      />
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.55, bottom: 0.12 }}
        onDragEnd={(_, info) => {
          if (info.offset.y < -70 || info.velocity.y < -450) close(false)
        }}
        initial={{ y: '-102%' }}
        animate={{ y: 0 }}
        exit={{ y: '-102%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        className="glass absolute inset-x-0 top-0 max-h-full overflow-hidden rounded-b-[38px] bg-zinc-900/70 pb-6 pt-14 shadow-2xl"
      >
        <div className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-white/40" />
        <div className="px-6">
          <div className="text-[13px] font-medium uppercase tracking-wide text-white/60">{dateLine}</div>
          <div className="text-[34px] font-bold leading-tight text-white">{time || '—'}</div>
        </div>

        <div className="no-scrollbar mt-3 max-h-[560px] space-y-2.5 overflow-y-auto px-4 pb-2">
          {playing && (
            <NotifCard
              app="music"
              title="Now Playing"
              body={`${track.title} — ${track.artist}`}
              time="live"
              onOpen={() => {
                close(false)
                launch('music')
              }}
              onDismiss={() => undefined}
              hideClose
            />
          )}
          {notifs.map((n) => (
            <NotifCard
              key={n.id}
              app={n.app}
              title={n.title}
              body={n.body}
              time={n.time}
              onOpen={() => {
                close(false)
                launch(n.app)
              }}
              onDismiss={() => dismiss(n.id)}
            />
          ))}
          {notifs.length === 0 && !playing && (
            <div className="py-8 text-center text-[14px] text-white/60">No new notifications</div>
          )}
        </div>

        {notifs.length > 0 && (
          <div className="mt-2 px-6">
            <button
              type="button"
              onClick={clear}
              className="w-full rounded-full bg-white/15 py-2 text-[13px] font-semibold text-white active:bg-white/25"
            >
              Clear All
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function NotifCard({
  app,
  title,
  body,
  time,
  onOpen,
  onDismiss,
  hideClose,
}: {
  app: keyof typeof APPS
  title: string
  body: string
  time: string
  onOpen: () => void
  onDismiss: () => void
  hideClose?: boolean
}) {
  const def = APPS[app]
  const Icon = def.icon
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      className="relative"
    >
      <button
        type="button"
        onClick={onOpen}
        className="glass flex w-full items-start gap-3 rounded-[22px] bg-white/12 p-3.5 pr-10 text-left ring-1 ring-white/15 active:bg-white/20"
      >
        <div className={`squircle icon-gloss relative h-9 w-9 shrink-0 ${def.gradient} flex items-center justify-center`}>
          {app === 'calendar' ? (
            <span className="text-[8px] font-bold leading-none text-red-500">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()]}
            </span>
          ) : (
            <Icon size={17} className="text-white" strokeWidth={2} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[13px] font-semibold text-white">{title}</span>
            <span className="shrink-0 text-[11px] text-white/55">{time}</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-white/80">{body}</p>
        </div>
      </button>
      {!hideClose && (
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white active:bg-white/35"
        >
          <X size={13} strokeWidth={2.6} />
        </button>
      )}
    </motion.div>
  )
}
