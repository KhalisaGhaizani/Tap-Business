import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Field, TextInput } from '../components/editor/fields'
import { Alert, Button } from '../components/ui'
import { errorMessage, useI18n } from '../i18n'
import { authApi } from '../lib/api'

export function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await authApi.forgotPassword(email)
      setSentTo(email)
    } catch (err) {
      setError(errorMessage(t, err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title={t('auth.forgot.title')} subtitle={sentTo ? undefined : t('auth.forgot.subtitle')}>
      {sentTo ? (
        <Alert kind="success">{t('auth.forgot.sent', { email: sentTo })}</Alert>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={t('auth.email')}>
            <TextInput type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          {error && <Alert kind="error">{error}</Alert>}
          <Button type="submit" busy={busy} className="w-full py-2.5">
            {t('auth.forgot.submit')}
          </Button>
        </form>
      )}
      <Link to="/login" className="mt-4 block text-center text-sm font-medium text-blue-600 hover:underline">
        {t('auth.backToLogin')}
      </Link>
    </AuthLayout>
  )
}
