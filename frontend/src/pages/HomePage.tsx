import { Nfc, PenLine, Shield, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { homePathFor, useAuth } from '../auth/AuthContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Logo } from '../components/Logo'
import { PhoneFrame } from '../components/PhoneFrame'
import { ProfileView } from '../components/profile/ProfileView'
import { demoProfiles } from '../data/demoProfile'
import { useI18n } from '../i18n'

const steps = [
  { icon: Nfc, n: 1 },
  { icon: PenLine, n: 2 },
  { icon: Smartphone, n: 3 },
] as const

export function HomePage() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to={user ? homePathFor(user) : '/login'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            {isAdmin && <Shield size={15} />}
            {user ? (isAdmin ? t('home.openAdmin') : t('home.openEditor')) : t('home.login')}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-10 pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              <Nfc size={14} /> {t('home.badge')}
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{t('home.title')}</h1>
            <p className="mt-4 text-lg text-slate-600">{t('home.subtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={user && !isAdmin ? '/edit' : '/login'}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                <PenLine size={18} /> {t('home.ctaEditor')}
              </Link>
              <Link
                to="/tap"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Smartphone size={18} /> {t('home.ctaTap')}
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <p className="mb-3 text-center text-xs font-semibold tracking-wide text-slate-400 uppercase">{t('home.previewLabel')}</p>
            <PhoneFrame>
              <ProfileView profile={demoProfiles[lang]} />
            </PhoneFrame>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {steps.map(({ icon: Icon, n }) => (
            <div key={n} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon size={20} />
                </span>
                <span className="text-xs font-semibold text-slate-400">{t('home.step', { n })}</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{t(`home.step${n}.title`)}</h3>
              <p className="mt-1 text-sm text-slate-600">{t(`home.step${n}.text`)}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-500">{t('home.footnote')}</p>
      </main>
    </div>
  )
}
