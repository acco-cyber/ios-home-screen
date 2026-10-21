'use client'

import { Plane, Wifi, WifiOff } from 'lucide-react'
import { useOS } from '@/lib/ios/store'
import { useClock } from '@/lib/ios/hooks'
import { APPS } from '@/lib/ios/apps'
import { cx } from '@/lib/ios/hooks'
import { usePlayer } from '@/lib/ios/player-store'

function SignalBars() {
  return (
    <div className="flex items-end gap-[2.5px]" aria-hidden>
      {[5, 7, 9, 11].map((h, i) => (
        <div
          key={i}
          style={{ height: h }}
          className={cx('w-[3px] rounded-[1px]', i < 3 ? 'bg-current' : 'bg-current opacity-40')}
        />
      ))}
    </div>
  )
}

export function StatusBar({ dark }: { dark?: boolean }) {
  const time = useClock()
  const airplane = useOS((s) => s.airplane)
  const wifi = useOS((s) => s.wifi)
  const battery = useOS((s) => s.battery)
  const lowPower = useOS((s) => s.lowPower)
  const openApp = useOS((s) => s.openApp)
  const musicPlaying = usePlayer((s) => s.playing)

  // over the wallpaper: always light; inside apps: follow the app chrome
  const light = openApp ? !APPS[openApp].lightChrome && !dark : !dark

  const battColor = lowPower ? 'text-amber-400' : light ? 'text-white' : 'text-black'

  return (
    <div
      className={cx(
        'pointer-events-none absolute inset-x-0 top-0 z-40 flex h-[54px] items-center justify-between px-8 pt-2 text-[15px] font-semibold ios-text-shadow',
        light ? 'text-white' : 'text-black',
      )}
    >
      <div className="w-[70px]">{time}</div>
      <div className={cx('flex items-center gap-1.5', light ? 'text-white' : 'text-black')}>
        {airplane ? (
          <Plane size={15} className="fill-current" />
        ) : musicPlaying ? null : (
          <>
            <SignalBars />
            <span className="text-[11px] font-bold">5G</span>
            {wifi ? <Wifi size={16} strokeWidth={2.4} /> : <WifiOff size={16} strokeWidth={2.4} className="opacity-70" />}
          </>
        )}
        <div className={cx('flex items-center gap-1', battColor)}>
          <span className="text-[12px] font-semibold tabular-nums">{battery}%</span>
          <div className="relative flex h-[12px] w-[24px] items-center rounded-[3.5px] border border-current px-[1.5px]">
            <div
              className={cx('h-[7px] rounded-[1.5px]', lowPower ? 'bg-amber-400' : 'bg-current')}
              style={{ width: `${Math.max(6, (battery / 100) * 18)}px` }}
            />
            <div className="absolute -right-[3px] h-[4px] w-[2px] rounded-r-sm bg-current opacity-60" />
          </div>
        </div>
      </div>
    </div>
  )
}
