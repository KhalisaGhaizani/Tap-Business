import type { TokenInfo } from '@tapbusiness/shared'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { homePathFor, useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/AuthLayout'
import { Field, TextInput } from '../components/editor/fields'
import { Alert, Button, PageLoader } from '../components/ui'
import { errorMessage, useI18n } from '../i18n'
import { authApi } from '../lib/api'

/** Landing page for invite (/activate/:token) and reset (/reset-password/:token) links. */
export function SetPasswordPage() {
  const { t } = useI18n()
  const { token = '' } = useParams()
  const { signedIn } = useAuth()
  const navigate = useNavigate()
  const [info, setInfo] = useState<TokenInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    authApi.tokenInfo(token).then(setInfo, (err) => setLoadError(errorMessage(t, err)))
  }, [token, t])

  if (loadError) {
    return (
      <AuthLayout title={t('auth.invalidLink.title')}>
        <Alert kind="error">{loadError}</Alert>
        <Link to="/login" className="mt-4 block text-center text-sm font-medium text-blue-600 hover:underline">
          {t('auth.backToLogin')}
        </Link>
      </AuthLayout>
    )
  }
  if (!info) return <PageLoader />

  const invite = info.type === 'invite'
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError(t('auth.passwordMismatch'))
    setBusy(true)
    setError(null)
    try {
      const { user } = await authApi.useToken(token, password)
      signedIn(user)
      navigate(homePathFor(user), { replace: true })
    } catch (err) {
      setError(errorMessage(t, err))
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title={invite ? t('auth.invite.title') : t('auth.reset.title')}
      subtitle={invite ? t('auth.invite.subtitle', { name: info.name, email: info.email }) : t('auth.reset.subtitle', { email: info.email })}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* lets password managers save the right username */}
        <input type="email" autoComplete="username" value={info.email} readOnly hidden />
        <Field label={t('auth.newPassword')} hint={t('auth.passwordHint')}>
          <TextInput type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
        </Field>
        <Field label={t('auth.confirmPassword')}>
          <TextInput type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        {error && <Alert kind="error">{error}</Alert>}
        <Button type="submit" busy={busy} className="w-full py-2.5">
          {invite ? t('auth.invite.submit') : t('auth.reset.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
