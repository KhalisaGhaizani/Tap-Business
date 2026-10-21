import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { homePathFor, useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/AuthLayout'
import { Field, TextInput } from '../components/editor/fields'
import { Alert, Button, PageLoader } from '../components/ui'
import { errorMessage, useI18n } from '../i18n'

/** Only follow ?next= to our own pages. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : null)

export function LoginPage() {
  const { t } = useI18n()
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <PageLoader />
  if (user) return <Navigate to={homePathFor(user)} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const u = await login(email, password)
      const next = safeNext(params.get('next'))
      navigate(next && next.startsWith(homePathFor(u)) ? next : homePathFor(u), { replace: true })
    } catch (err) {
      setError(errorMessage(t, err))
      setBusy(false)
    }
  }

  return (
    <AuthLayout title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={t('auth.email')}>
          <TextInput type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </Field>
        <Field label={t('auth.password')}>
          <TextInput type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <Alert kind="error">{error}</Alert>}
        <Button type="submit" busy={busy} className="w-full py-2.5">
          {t('auth.login.submit')}
        </Button>
        <Link to="/forgot-password" className="text-center text-sm font-medium text-blue-600 hover:underline">
          {t('auth.login.forgot')}
        </Link>
      </form>
      <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">{t('auth.login.noAccount')}</p>
    </AuthLayout>
  )
}
