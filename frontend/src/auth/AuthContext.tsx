import type { Role, SessionUser } from '@tapbusiness/shared'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { PageLoader } from '../components/ui'
import { hasStoredLang, useI18n } from '../i18n'
import { ApiError, authApi, meApi } from '../lib/api'

interface Auth {
  user: SessionUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<SessionUser>
  logout: () => Promise<void>
  /** Store the user returned by an endpoint that signs in (activation, reset). */
  signedIn: (user: SessionUser) => void
  updateUser: (user: SessionUser) => void
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { lang, setLang } = useI18n()

  useEffect(() => {
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) console.error(err)
      })
      .finally(() => setLoading(false))
  }, [])

  // a fresh browser follows the account's language; an explicit choice here wins afterwards
  useEffect(() => {
    if (user && !hasStoredLang() && user.locale !== lang) setLang(user.locale)
  }, [user]) // only when the user changes, not on every language switch

  // keep the account language (used for emails) in sync with what the user picks
  useEffect(() => {
    if (user && user.locale !== lang && hasStoredLang()) {
      meApi.updateAccount({ locale: lang }).then(({ user }) => setUser(user), () => {})
    }
  }, [lang, user])

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await authApi.login(email, password)
    setUser(user)
    return user
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {})
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout, signedIn: setUser, updateUser: setUser }), [user, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const homePathFor = (user: SessionUser) => (user.role === 'admin' ? '/admin' : '/edit')

/** Render children only for a signed-in user with the given role. */
export function RequireAuth({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (user.role !== role) return <Navigate to={homePathFor(user)} replace />
  return <>{children}</>
}
