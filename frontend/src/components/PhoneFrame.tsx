import type { ReactNode } from 'react'

export function PhoneFrame({ children, overlay }: { children: ReactNode; overlay?: ReactNode }) {
  return (
    <div className="relative mx-auto h-[640px] w-[320px] shrink-0 rounded-[44px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
      <div className="absolute top-2 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" />
      <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-white">
        <div className="h-full overflow-y-auto">{children}</div>
        {overlay}
      </div>
    </div>
  )
}
