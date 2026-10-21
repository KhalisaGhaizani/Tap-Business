import { LogOut, Shield } from 'lucide-react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'
import { Logo } from '../../components/Logo'
import { Button } from '../../components/ui'
import { useI18n } from '../../i18n'

export function AdminLayout() {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2">
            <Logo />
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
              <Shield size={12} /> {t('admin.title')}
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <span className="hidden text-sm text-slate-500 md:inline">{user?.email}</span>
            <Button
              variant="ghost"
              className="!px-3 !py-1.5"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              <LogOut size={16} /> <span className="hidden sm:inline">{t('common.logout')}</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
