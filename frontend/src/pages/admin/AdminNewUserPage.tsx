import { cardIdSchema, locales, usernameSchema, type CreatedUser, type Locale, type Role } from '@tapbusiness/shared'
import { ArrowLeft, CheckCircle2, PenLine, Shield, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Field, Select, TextInput } from '../../components/editor/fields'
import { QrCode } from '../../components/QrCode'
import { Alert, Button, Card, CopyField } from '../../components/ui'
import { errorMessage, useI18n } from '../../i18n'
import { ApiError, adminApi } from '../../lib/api'
import { AccessLinkPanel, availabilityText, useAvailability } from './shared'

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)

export function AdminNewUserPage() {
  const { t, lang } = useI18n()
  const [created, setCreated] = useState<CreatedUser | null>(null)
  const [formKey, setFormKey] = useState(0)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link to="/admin" className="inline-flex items-center gap-1 self-start text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> {t('admin.user.back')}
      </Link>
      {created ? (
        <CreatedPanel
          created={created}
          onAnother={() => {
            setCreated(null)
            setFormKey((k) => k + 1)
          }}
        />
      ) : (
        <NewUserForm key={formKey} defaultLocale={lang} onCreated={setCreated} />
      )}
    </div>
  )
}

function NewUserForm({ defaultLocale, onCreated }: { defaultLocale: Locale; onCreated: (c: CreatedUser) => void }) {
  const { t } = useI18n()
  const [role, setRole] = useState<Role>('customer')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [username, setUsername] = useState('')
  const [usernameEdited, setUsernameEdited] = useState(false)
  const [cardId, setCardId] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ text: string; field?: string } | null>(null)
  const isCustomer = role === 'customer'

  const suggestCardId = () => adminApi.nextCardId().then((r) => setCardId(r.cardId), () => {})
  useEffect(() => {
    void suggestCardId()
    adminApi.config().then((c) => {
      setEmailEnabled(c.emailEnabled)
      setSendEmail(c.emailEnabled)
    }, () => {})
  }, [])

  // keep suggesting a username from the name until the admin types their own
  useEffect(() => {
    if (!usernameEdited) setUsername(slugify(name))
  }, [name, usernameEdited])

  const normalizedUsername = username.trim().toLowerCase()
  const normalizedCard = cardId.trim().toUpperCase()
  const usernameLocal = normalizedUsername ? usernameSchema.safeParse(normalizedUsername).error?.issues[0]?.message : undefined
  const cardLocal = normalizedCard ? cardIdSchema.safeParse(normalizedCard).error?.issues[0]?.message : undefined
  const emailCheck = useAvailability('email', email, { skip: !email.includes('@') })
  const usernameCheck = useAvailability('username', normalizedUsername, { skip: !isCustomer || Boolean(usernameLocal) })
  const cardCheck = useAvailability('cardId', normalizedCard, { skip: !isCustomer || Boolean(cardLocal) })

  const usernameText = availabilityText(t, usernameLocal, usernameCheck)
  const cardText = availabilityText(t, cardLocal, cardCheck)
  const emailText = emailCheck && emailCheck !== 'checking' && !emailCheck.available ? { error: t('errors.EMAIL_TAKEN') } : {}
  const fieldError = (field: string) => (error?.field === field ? error.text : undefined)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const base = { name, email, locale, sendEmail }
      const result = await adminApi.createUser(
        isCustomer ? { ...base, role: 'customer', username: normalizedUsername, cardId: normalizedCard } : { ...base, role: 'admin' },
      )
      onCreated(result)
    } catch (err) {
      setError({ text: errorMessage(t, err), field: err instanceof ApiError ? err.field : undefined })
      setBusy(false)
    }
  }

  const roleOptions = [
    { value: 'customer' as const, icon: UserRound },
    { value: 'admin' as const, icon: Shield },
  ]

  return (
    <Card>
      <h1 className="text-lg font-semibold text-slate-900">{t('admin.new.title')}</h1>
      <p className="mb-5 text-sm text-slate-500">{t('admin.new.description')}</p>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">{t('admin.form.role')}</span>
          <div role="radiogroup" className="grid grid-cols-2 gap-2">
            {roleOptions.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={role === value}
                onClick={() => setRole(value)}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition ${
                  role === value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon size={16} /> {t(`role.${value}`)}
              </button>
            ))}
          </div>
          {!isCustomer && <p className="mt-2 text-xs text-slate-500">{t('admin.form.adminNote')}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('admin.form.name')} error={fieldError('name')}>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoFocus />
          </Field>
          <Field label={t('admin.form.email')} error={fieldError('email') ?? emailText.error}>
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
        </div>

        {isCustomer && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('admin.form.username')}
              error={fieldError('username') ?? usernameText.error}
              hint={usernameText.hint ?? t('admin.form.usernameHint', { url: `${window.location.host}/u/${normalizedUsername || '…'}` })}
            >
              <TextInput
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setUsernameEdited(true)
                }}
                required
                maxLength={30}
                autoCapitalize="none"
                spellCheck={false}
              />
            </Field>
            <Field label={t('admin.form.cardId')} error={fieldError('cardId') ?? cardText.error} hint={cardText.hint ?? t('admin.form.cardIdHint')}>
              <div className="flex gap-2">
                <TextInput value={cardId} onChange={(e) => setCardId(e.target.value)} maxLength={32} placeholder="TB-0001" className="font-mono" />
                <Button type="button" variant="secondary" className="shrink-0 !px-3" onClick={suggestCardId}>
                  {t('admin.form.suggest')}
                </Button>
              </div>
            </Field>
          </div>
        )}

        {emailEnabled ? (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            {t('admin.form.sendEmail')}
          </label>
        ) : (
          <Alert kind="info">{t('admin.form.emailDisabled')}</Alert>
        )}

        {error && !error.field && <Alert kind="error">{error.text}</Alert>}
        <Button type="submit" busy={busy} className="self-start">
          {t('admin.form.create')}
        </Button>
      </form>
    </Card>
  )
}

function CreatedPanel({ created, onAnother }: { created: CreatedUser; onAnother: () => void }) {
  const { t } = useI18n()
  const { user, links } = created
  const origin = window.location.origin
  const profileUrl = user.username ? `${origin}/u/${user.username}` : null
  const cardUrl = user.cardId ? `${origin}/c/${user.cardId}` : null

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={28} className="shrink-0 text-emerald-600" />
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{t('admin.created.title')}</h1>
          <p className="text-sm text-slate-500">{t('admin.created.text', { name: user.name })}</p>
        </div>
      </div>

      <AccessLinkPanel links={links} name={user.name} email={user.email} />

      {profileUrl && (
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 flex-col gap-4">
            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">{t('admin.created.profileUrl')}</span>
              <CopyField value={profileUrl} />
            </div>
            {cardUrl && (
              <div>
                <span className="mb-1 block text-sm font-medium text-slate-700">{t('admin.created.cardUrl')}</span>
                <CopyField value={cardUrl} />
                <p className="mt-1 text-xs text-slate-500">{t('share.cardHint')}</p>
              </div>
            )}
          </div>
          <QrCode value={cardUrl ?? profileUrl} fileName={`tapbusiness-${user.cardId ?? user.username}`} size={140} />
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {user.role === 'customer' && (
          <Link
            to={`/admin/users/${user.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <PenLine size={16} /> {t('admin.created.editProfile')}
          </Link>
        )}
        <Link
          to={`/admin/users/${user.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          {t('admin.created.viewAccount')}
        </Link>
        <Button variant="ghost" onClick={onAnother}>
          {t('admin.created.another')}
        </Button>
      </div>
    </Card>
  )
}
