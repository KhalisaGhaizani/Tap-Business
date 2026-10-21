import { AlertTriangle, Check, CheckCircle2, Copy, Info, Loader2 } from 'lucide-react'
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useI18n } from '../i18n'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
}

export function Button({
  variant = 'primary',
  busy = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }) {
  return (
    <button
      {...props}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {busy && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-slate-400" />
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size={28} />
    </div>
  )
}

const alertStyles = {
  error: { box: 'border-red-200 bg-red-50 text-red-700', icon: AlertTriangle },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  info: { box: 'border-blue-200 bg-blue-50 text-blue-800', icon: Info },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-800', icon: AlertTriangle },
}

export function Alert({ kind, children, className = '' }: { kind: keyof typeof alertStyles; children: ReactNode; className?: string }) {
  const { box, icon: Icon } = alertStyles[kind]
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`flex gap-2 rounded-lg border px-3 py-2 text-sm ${box} ${className}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-5 ${className}`}>{children}</div>
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }
      }}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-white ${className}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t('common.copied') : t('common.copy')}
    </button>
  )
}

/** A read-only value (link, ID) with a copy button. */
export function CopyField({ value, extra }: { value: string; extra?: ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1 pr-1 pl-3 text-sm">
      <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-slate-700" title={value}>
        {value}
      </span>
      <CopyButton text={value} />
      {extra}
    </div>
  )
}
