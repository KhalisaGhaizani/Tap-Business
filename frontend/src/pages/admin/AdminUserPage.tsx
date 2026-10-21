import { cardIdSchema, locales, usernameSchema, type AccessLinks, type AdminUserDetail, type Locale } from '@tapbusiness/shared'
import { ArrowLeft, ExternalLink, KeyRound, PenLine, Power, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Field, Select, TextInput } from '../../components/editor/fields'
import { StatsPanel } from '../../components/StatsPanel'
import { Alert, Button, Card, PageLoader } from '../../components/ui'
import { errorMessage, useFormatters, useI18n } from '../../i18n'
import { ApiError, adminApi, profileApi, type AnalyticsDays } from '../../lib/api'
import { AccessLinkPanel, availabilityText, StatusBadge, useAvailability } from './shared'

export function AdminUserPage() {
  const { t } = useI18n()
  const { id = '' } = useParams()
  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    setUser(null)
    adminApi.user(id).then(setUser, setError)
  }, [id])

  const loadStats = useCallback((days: AnalyticsDays) => profileApi(`/api/admin/users/${id}`).analytics(days), [id])

  if (error) return <Alert kind="error">{errorMessage(t, error)}</Alert>
  if (!user) return <PageLoader />
  const isCustomer = user.role === 'customer'

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin" className="inline-flex items-center gap-1 self-start text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> {t('admin.user.back')}
      </Link>

      <div className="flex flex-wrap items-start gap-3">
        <div className="mr-auto min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
            <StatusBadge status={user.status} />
            {!isCustomer && <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">{t('role.admin')}</span>}
          </div>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        {isCustomer && (
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/admin/users/${user.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <PenLine size={16} /> {t('admin.user.editProfile')}
            </Link>
            <a
              href={`/u/${user.username}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <ExternalLink size={16} /> {t('admin.user.viewProfile')}
            </a>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <DetailsForm key={user.id} user={user} onSaved={setUser} />
          {isCustomer && (
            <Card>
              <h2 className="mb-4 text-base font-semibold text-slate-900">{t('stats.title')}</h2>
              <StatsPanel load={loadStats} />
            </Card>
          )}
        </div>
        <div className="flex flex-col gap-5">
          <AccessCard user={user} />
          <MetaCard user={user} />
          <DangerZone user={user} onChanged={setUser} />
        </div>
      </div>
    </div>
  )
}

function DetailsForm({ user, onSaved }: { user: AdminUserDetail; onSaved: (u: AdminUserDetail) => void }) {
  const { t } = useI18n()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [locale, setLocale] = useState<Locale>(user.locale)
  const [username, setUsername] = useState(user.username ?? '')
  const [cardId, setCardId] = useState(user.cardId ?? '')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string; field?: string } | null>(null)
  const isCustomer = user.role === 'customer'

  const u = username.trim().toLowerCase()
  const c = cardId.trim().toUpperCase()
  const usernameLocal = usernameSchema.safeParse(u).error?.issues[0]?.message
  const cardLocal = c ? cardIdSchema.safeParse(c).error?.issues[0]?.message : undefined
  const usernameCheck = useAvailability('username', u, { skip: !isCustomer || u === user.username || Boolean(usernameLocal), excludeUserId: user.id })
  const cardCheck = useAvailability('cardId', c, { skip: !isCustomer || c === (user.cardId ?? '') || Boolean(cardLocal), excludeUserId: user.id })
  const usernameText = availabilityText(t, u === user.username ? undefined : usernameLocal, usernameCheck)
  const cardText = availabilityText(t, cardLocal, cardCheck)
  const fieldError = (field: string) => (result && !result.ok && result.field === field ? result.text : undefined)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setResult(null)
    try {
      const updated = await adminApi.updateUser(user.id, {
        name,
        email,
        locale,
        ...(isCustomer && { username: u, cardId: c }),
      })
      onSaved(updated)
      setResult({ ok: true, text: t('admin.user.saved') })
    } catch (err) {
      setResult({ ok: false, text: errorMessage(t, err), field: err instanceof ApiError ? err.field : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-slate-900">{t('admin.user.details')}</h2>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('admin.form.name')} error={fieldError('name')}>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
          </Field>
          <Field label={t('admin.form.email')} error={fieldError('email')}>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={160} />
          </Field>
          <Field label={t('admin.form.locale')}>
            <Select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              {locales.map((l) => (
                <option key={l} value={l}>
                  {t(`lang.${l}`)}
                </option>
              ))}
            </Select>
          </Field>
          {isCustomer && (
            <>
              <Field label={t('admin.form.username')} error={fieldError('username') ?? usernameText.error} hint={usernameText.hint}>
                <TextInput value={username} onChange={(e) => setUsername(e.target.value)} required maxLength={30} autoCapitalize="none" spellCheck={false} />
              </Field>
              <Field label={t('admin.form.cardId')} error={fieldError('cardId') ?? cardText.error} hint={cardText.hint ?? t('admin.form.cardIdHint')}>
                <TextInput value={cardId} onChange={(e) => setCardId(e.target.value)} maxLength={32} className="font-mono" />
              </Field>
            </>
          )}
        </div>
        {result && !result.field && <Alert kind={result.ok ? 'success' : 'error'}>{result.text}</Alert>}
        <Button type="submit" busy={busy} className="self-start">
          {t('admin.user.save')}
        </Button>
      </form>
    </Card>
  )
}

function AccessCard({ user }: { user: AdminUserDetail }) {
  const { t } = useI18n()
  const [links, setLinks] = useState<AccessLinks | null>(null)
  const [sendEmail, setSendEmail] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi.config().then((c) => setEmailEnabled(c.emailEnabled), () => {})
  }, [])
  useEffect(() => setLinks(null), [user.status])

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      setLinks(await adminApi.accessLink(user.id, sendEmail))
    } catch (err) {
      setError(errorMessage(t, err))
    } finally {
      setBusy(false)
    }
  }

  const hint =
    user.status === 'disabled'
      ? t('admin.user.accessDisabledHint')
      : user.status === 'pending'
        ? t('admin.user.accessPendingHint', { name: user.name })
        : t('admin.user.accessActiveHint', { name: user.name })

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <KeyRound size={16} /> {t('admin.user.access')}
      </h2>
      <p className="text-sm text-slate-500">{hint}</p>
      {user.status !== 'disabled' && (
        <>
          {emailEnabled && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              {t('admin.user.alsoEmail')}
            </label>
          )}
          <Button variant="secondary" busy={busy} onClick={create} className="self-start">
            {user.status === 'pending' ? t('admin.user.newInvite') : t('admin.user.newReset')}
          </Button>
        </>
      )}
      {error && <Alert kind="error">{error}</Alert>}
      {links && <AccessLinkPanel links={links} name={user.name} email={user.email} />}
    </Card>
  )
}

function MetaCard({ user }: { user: AdminUserDetail }) {
  const { t } = useI18n()
  const fmt = useFormatters()
  const rows = [
    [t('admin.user.created'), fmt.dateTime(user.createdAt)],
    [t('admin.user.activated'), fmt.dateTime(user.activatedAt)],
    [t('admin.user.lastLogin'), fmt.dateTime(user.lastLoginAt)],
    ...(user.role === 'customer' ? [[t('admin.user.profileUpdated'), fmt.dateTime(user.profileUpdatedAt)]] : []),
  ]
  return (
    <Card>
      <dl className="flex flex-col gap-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

function DangerZone({ user, onChanged }: { user: AdminUserDetail; onChanged: (u: AdminUserDetail) => void }) {
  const { t } = useI18n()
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState<'toggle' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  if (me?.id === user.id) return null

  const disabled = user.status === 'disabled'
  const toggle = async () => {
    if (!disabled && !confirm(t('admin.user.confirmDisable', { name: user.name }))) return
    setBusy('toggle')
    setError(null)
    try {
      onChanged(await adminApi.updateUser(user.id, { disabled: !disabled }))
    } catch (err) {
      setError(errorMessage(t, err))
    } finally {
      setBusy(null)
    }
  }
  const remove = async () => {
    if (!confirm(t('admin.user.confirmDelete', { name: user.name }))) return
    setBusy('delete')
    setError(null)
    try {
      await adminApi.deleteUser(user.id)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(errorMessage(t, err))
      setBusy(null)
    }
  }

  return (
    <Card className="flex flex-col gap-4 border-red-200">
      <h2 className="text-base font-semibold text-red-700">{t('admin.user.dangerZone')}</h2>
      <div>
        <Button variant={disabled ? 'secondary' : 'danger'} busy={busy === 'toggle'} onClick={toggle}>
          <Power size={16} /> {disabled ? t('admin.user.enable') : t('admin.user.disable')}
        </Button>
        <p className="mt-1 text-xs text-slate-500">{t('admin.user.disableHint')}</p>
      </div>
      <div>
        <Button variant="danger" busy={busy === 'delete'} onClick={remove}>
          <Trash2 size={16} /> {t('admin.user.delete')}
        </Button>
        <p className="mt-1 text-xs text-slate-500">{t('admin.user.deleteHint')}</p>
      </div>
      {error && <Alert kind="error">{error}</Alert>}
    </Card>
  )
}
