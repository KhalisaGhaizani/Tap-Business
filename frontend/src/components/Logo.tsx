import { Nfc } from 'lucide-react'

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-lg font-bold ${light ? 'text-white' : 'text-slate-900'}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
        <Nfc size={18} />
      </span>
      TapBusiness
    </span>
  )
}
