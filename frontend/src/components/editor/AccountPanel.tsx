import { locales, usernameSchema } from '@tapbusiness/shared'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { errorMessage, useI18n, validationMessage } from '../../i18n'
import { meApi, type Availability } from '../../lib/api'
import { applySaved, useProfile } from '../../store/profileStore'
import { Alert, Button } from '../ui'
import { Field, PanelTitle, Select, TextInput } from './fields'

export function AccountPanel() {
  const { t } = useI18n()
  return (
    <div>
      <PanelTitle title={t('account.title')} description={t('account.description')} />
      <div className="flex flex-col gap-8">
        <DetailsForm />
        <UsernameForm />
        <PasswordForm />
      </div>
    </div>
  )
}

function DetailsForm() {
  const { t, lang, setLang } = useI18n()
  const { user, updateUser } = useAuth()
  const [name, setName] = useState(user!.name)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setResult(null)
    try {
      const { user } = await meApi.updateAccount({ name, locale: lang })
      updateUser(user)
      setResult({ ok: true, text: t('common.saved') })
    } catch (err) {
      setResult({ ok: false, text: errorMessage(t, err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-800">{t('account.details')}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('account.name')}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        </Field>
        <Field label={t('account.email')} hint={t('account.emailHint')}>
          <TextInput value={user!.email} disabled />
        </Field>
        <Field label={t('account.language')}>
          <Select value={lang} onChange={(e) => setLang(e.target.value as (typeof locales)[number])}>
            {locales.map((l) => (
              <option key={l} value={l}>
                {t(`lang.${l}`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {result && <Alert kind={result.ok ? 'success' : 'error'}>{result.text}</Alert>}
      <Button type="submit" busy={busy} className="self-start">
        {t('common.save')}
      </Button>
    </form>
  )
}

function UsernameForm() {
  const { t } = useI18n()
  const profile = useProfile()
  const [value, setValue] = useState(profile.username)
  const [availability, setAvailability] = useState<Availability | 'checking' | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const normalized = value.trim().toLowerCase()
  const changed = normalized !== profile.username

  useEffect(() => {
    if (!changed) return setAvailability(null)
    const parsed = usernameSchema.safeParse(normalized)
    if (!parsed.success) return setAvailability({ available: false, reason: parsed.error.issues[0]?.message })
    setAvailability('checking')
    const timer = setTimeout(() => meApi.usernameAvailability(normalized).then(setAvailability, () => setAvailability(null)), 400)
    return () => clearTimeout(timer)
  }, [normalized, changed])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setResult(null)
    try {
      const { username } = await meApi.changeUsername(normalized)
      applySaved({ username })
      setValue(username)
      setResult({ ok: true, text: t('account.usernameChanged') })
    } catch (err) {
      setResult({ ok: false, text: errorMessage(t, err) })
    } finally {
      setBusy(false)
    }
  }

  let hint: string = t('account.usernameHint', { url: `${window.location.host}/u/${normalized || '…'}` })
  let error: string | undefined
  if (availability === 'checking') hint = t('common.checking')
  else if (availability?.available) hint = `✓ ${t('common.available')} · ${hint}`
  else if (availability) error = validationMessage(t, availability.reason) ?? t('common.taken')

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Field label={t('account.username')} hint={hint} error={error}>
        <TextInput value={value} onChange={(e) => setValue(e.target.value)} maxLength={30} autoCapitalize="none" spellCheck={false} />
      </Field>
      {changed && <Alert kind="warning">{t('account.usernameWarning')}</Alert>}
      {result && <Alert kind={result.ok ? 'success' : 'error'}>{result.text}</Alert>}
      <Button type="submit" variant="secondary" busy={busy} disabled={!changed || availability === 'checking' || !availability?.available} className="self-start">
        {t('account.usernameChange')}
      </Button>
    </form>
  )
}

function PasswordForm() {
  const { t } = useI18n()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setResult(null)
    try {
      await meApi.changePassword(current, next)
      setCurrent('')
      setNext('')
      setResult({ ok: true, text: t('account.passwordChanged') })
    } catch (err) {
      setResult({ ok: false, text: errorMessage(t, err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-800">{t('account.password')}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('account.currentPassword')}>
          <TextInput type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field label={t('auth.newPassword')} hint={t('auth.passwordHint')}>
          <TextInput type="password" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} required />
        </Field>
      </div>
      {result && <Alert kind={result.ok ? 'success' : 'error'}>{result.text}</Alert>}
      <Button type="submit" variant="secondary" busy={busy} className="self-start">
        {t('account.changePassword')}
      </Button>
    </form>
  )
}
