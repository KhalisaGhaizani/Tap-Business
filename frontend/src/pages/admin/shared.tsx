import type { AccessLinks, UserStatus } from '@tapbusiness/shared'
import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CopyField } from '../../components/ui'
import { useFormatters, useI18n, validationMessage, type Translate } from '../../i18n'
import { adminApi, type Availability } from '../../lib/api'

const statusStyles: Record<UserStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  disabled: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function StatusBadge({ status }: { status: UserStatus }) {
  const { t } = useI18n()
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ${statusStyles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {t(`status.${status}`)}
    </span>
  )
}

/** A freshly created activation / reset link, ready to hand to the customer. */
export function AccessLinkPanel({ links, name, email }: { links: AccessLinks; name: string; email: string }) {
  const { t } = useI18n()
  const fmt = useFormatters()
  const invite = links.actionUrl.includes('/activate/')
  const message = t(invite ? 'admin.link.inviteMessage' : 'admin.link.resetMessage', { name, url: links.actionUrl })

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
      <span className="text-sm font-semibold text-slate-800">{invite ? t('admin.link.invite') : t('admin.link.reset')}</span>
      <CopyField
        value={links.actionUrl}
        extra={
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
            title={t('admin.link.whatsapp')}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-emerald-700 hover:bg-white"
          >
            <MessageCircle size={14} /> <span className="hidden sm:inline">WhatsApp</span>
          </a>
        }
      />
      <span className="text-xs text-slate-500">{t('admin.link.expires', { date: fmt.dateTime(links.expiresAt) })}</span>
      {links.emailSent && <span className="text-xs font-medium text-emerald-700">{t('admin.created.emailSent', { email })}</span>}
    </div>
  )
}

type Field = 'username' | 'cardId' | 'email'

/** Debounced server-side uniqueness check used by the admin forms. */
export function useAvailability(field: Field, value: string, opts: { skip?: boolean; excludeUserId?: string } = {}) {
  const [state, setState] = useState<Availability | 'checking' | null>(null)
  const { skip = false, excludeUserId } = opts

  useEffect(() => {
    if (skip || !value.trim()) return setState(null)
    setState('checking')
    const timer = setTimeout(
      () =>
        adminApi.availability({ [field]: value.trim(), excludeUserId }).then(
          (r) => setState(r[field] ?? null),
          () => setState(null),
        ),
      350,
    )
    return () => clearTimeout(timer)
  }, [field, value, skip, excludeUserId])

  return state
}

/** Hint/error text for a field that is validated locally and then checked on the server. */
export function availabilityText(t: Translate, local: string | undefined, remote: Availability | 'checking' | null) {
  if (local) return { error: validationMessage(t, local) ?? local }
  if (remote === 'checking') return { hint: t('common.checking') }
  if (remote && !remote.available) return { error: validationMessage(t, remote.reason) ?? t('common.taken') }
  if (remote?.available) return { hint: `✓ ${t('common.available')}` }
  return {}
}
