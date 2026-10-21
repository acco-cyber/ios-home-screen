'use client'

import { Minus } from 'lucide-react'
import { APPS } from '@/lib/ios/apps'
import type { AppId } from '@/lib/ios/types'
import { cx } from '@/lib/ios/hooks'

interface AppIconProps {
  app: AppId
  wiggle: boolean
  showLabel?: boolean
  size?: number
  /** while being dragged: translate (design px) + lifted style */
  dragStyle?: { x: number; y: number; active: boolean }
  onRemove?: () => void
  slotRefData: string
}

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export function AppIcon({
  app,
  wiggle,
  showLabel = true,
  size = 58,
  dragStyle,
  onRemove,
  slotRefData,
}: AppIconProps) {
  const def = APPS[app]
  const Icon = def.icon
  const dragging = dragStyle?.active

  const now = new Date()

  return (
    <div
      data-slot={slotRefData}
      data-app={app}
      className={cx('relative flex select-none flex-col items-center gap-[6px]', dragging && 'icon-dragging')}
      style={
        dragging
          ? { transform: `translate(${dragStyle.x}px, ${dragStyle.y}px) scale(1.15)`, opacity: 0.92 }
          : undefined
      }
    >
      <div
        className={cx(
          'relative cursor-pointer transition-transform duration-150',
          !dragging && 'active:scale-[0.88]',
          wiggle && !dragging && 'wiggling',
        )}
        style={{ '--wiggle-delay': `${(size * 7) % 260}ms`, width: size, height: size } as React.CSSProperties}
      >
        <div
          className={cx(
            'squircle icon-gloss relative h-full w-full overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.35)] ring-1 ring-white/10',
            def.gradient,
          )}
        >
          {app === 'calendar' ? (
            <div className="flex h-full w-full flex-col items-center justify-center bg-white text-black">
              <span className="text-[10px] font-bold leading-none tracking-wide text-red-500">
                {DAY_NAMES[now.getDay()]}
              </span>
              <span className="mt-[2px] text-[26px] font-light leading-none">{now.getDate()}</span>
            </div>
          ) : app === 'photos' ? (
            <div className="flex h-full w-full items-center justify-center bg-white">
              <svg viewBox="0 0 48 48" className="h-[62%] w-[62%]" aria-hidden>
                {[
                  [' #ffcc00', 0],
                  ['#ff9500', 45],
                  ['#ff3b30', 90],
                  ['#af52de', 135],
                  ['#34c759', 180],
                  ['#00c7be', 225],
                  ['#007aff', 270],
                  ['#5856d6', 315],
                ].map(([color, deg], i) => (
                  <ellipse
                    key={i}
                    cx="24"
                    cy="13"
                    rx="6.2"
                    ry="10.5"
                    fill={color as string}
                    opacity="0.82"
                    transform={`rotate(${deg} 24 24)`}
                  />
                ))}
              </svg>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon
                size={size * 0.5}
                strokeWidth={1.9}
                className={cx('drop-shadow-sm', app === 'notes' ? 'text-white' : 'text-white')}
              />
            </div>
          )}
        </div>

        {wiggle && onRemove && (
          <button
            type="button"
            aria-label={`Remove ${def.name} from Home Screen`}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute -left-1.5 -top-1.5 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-zinc-800/90 text-white shadow-md ring-1 ring-white/40"
          >
            <Minus size={13} strokeWidth={3.2} />
          </button>
        )}
      </div>
      {showLabel && (
        <span className="ios-text-shadow max-w-[76px] truncate text-[11px] font-medium leading-none text-white">
          {def.name}
        </span>
      )}
    </div>
  )
}
