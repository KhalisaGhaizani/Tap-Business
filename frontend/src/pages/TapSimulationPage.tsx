import { ArrowLeft, Nfc, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { PhoneFrame } from '../components/PhoneFrame'
import { ProfileView } from '../components/profile/ProfileView'
import { demoProfiles } from '../data/demoProfile'
import { getTheme } from '../data/themes'
import { useI18n } from '../i18n'
import { profileApi } from '../lib/api'
import type { Profile, PublicProfile } from '../types'

type Stage = 'idle' | 'tapping' | 'notified' | 'open'

export function TapSimulationPage() {
  const { t, lang, intlLocale } = useI18n()
  const { user } = useAuth()
  const [own, setOwn] = useState<Profile | null>(null)
  const [stage, setStage] = useState<Stage>('idle')

  useEffect(() => {
    if (user?.role === 'customer') profileApi('/api/me').get().then(setOwn, () => {})
  }, [user])

  const profile: PublicProfile = own ?? demoProfiles[lang]
  const theme = getTheme(profile.themeId)
  const host = window.location.host

  useEffect(() => {
    const next = { tapping: ['notified', 1200], notified: ['open', 1600] } as const
    if (stage === 'tapping' || stage === 'notified') {
      const [to, delay] = next[stage]
      const timer = setTimeout(() => setStage(to), delay)
      return () => clearTimeout(timer)
    }
  }, [stage])

  const now = new Date()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Link to={own ? '/edit' : '/'} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> {t('common.back')}
        </Link>
        <LanguageSwitcher dark />
      </header>

      <main className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-16">
        <h1 className="text-center text-2xl font-bold sm:text-3xl">{t('tap.title')}</h1>
        <p className="mt-2 max-w-lg text-center text-slate-400">{t('tap.subtitle')}</p>
        {!own && <p className="mt-2 text-center text-xs text-slate-500">{t('tap.demoNote')}</p>}

        <div className="mt-10 flex flex-col items-center gap-10 md:flex-row md:gap-16">
          {/* the card */}
          <div
            className="transition-transform duration-700 ease-out"
            style={{ transform: stage === 'idle' ? 'none' : 'translateX(clamp(0px, 6vw, 60px)) rotate(-4deg) scale(0.97)' }}
          >
            <div
              className="relative flex h-[190px] w-[300px] flex-col justify-between overflow-hidden rounded-2xl p-5 shadow-2xl"
              style={{ background: theme.coverBg, color: '#fff', fontFamily: theme.font }}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-bold tracking-wide">TapBusiness</span>
                <Nfc size={28} className="opacity-90" />
              </div>
              <div>
                <div className="text-xl font-bold">{profile.name || t('common.yourName')}</div>
                <div className="text-sm opacity-80">{profile.title}</div>
              </div>
              <div className="font-mono text-[10px] opacity-60">{own?.cardId ?? 'TB-0001'}</div>
            </div>
          </div>

          {/* the recipient's phone */}
          <div className="relative">
            {stage === 'tapping' && (
              <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                {[0, 0.4, 0.8].map((d) => (
                  <span
                    key={d}
                    className="nfc-wave absolute -top-16 -left-16 h-32 w-32 rounded-full border-2 border-blue-400"
                    style={{ animationDelay: `${d}s` }}
                  />
                ))}
              </div>
            )}
            <PhoneFrame
              overlay={
                stage === 'notified' && (
                  <div className="slide-down absolute top-8 right-3 left-3 z-20 rounded-2xl bg-white/95 p-3 text-slate-900 shadow-lg">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-blue-600 text-white">
                        <Nfc size={10} />
                      </span>
                      {t('tap.notification')}
                    </div>
                    <div className="mt-1 text-sm font-semibold">{t('tap.opening', { name: profile.name })}</div>
                    <div className="truncate text-xs text-slate-500">
                      {host}/u/{profile.username}
                    </div>
                  </div>
                )
              }
            >
              {stage === 'open' ? (
                <ProfileView profile={profile} />
              ) : (
                <div className="flex h-full flex-col items-center bg-gradient-to-b from-slate-700 to-slate-900 pt-20 text-white">
                  <div className="text-6xl font-light">{now.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="mt-2 text-sm opacity-70">{now.toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                  <div className="mt-auto mb-16 flex flex-col items-center gap-2 text-xs opacity-60">
                    <Nfc size={22} />
                    {t('tap.holdCard')}
                  </div>
                </div>
              )}
            </PhoneFrame>
          </div>
        </div>

        {stage === 'open' ? (
          <button
            onClick={() => setStage('idle')}
            className="mt-10 inline-flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            <RotateCcw size={18} /> {t('tap.again')}
          </button>
        ) : (
          <button
            onClick={() => setStage('tapping')}
            disabled={stage !== 'idle'}
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            <Nfc size={20} /> {stage === 'idle' ? t('tap.button') : t('tap.reading')}
          </button>
        )}
        <p className="mt-3 text-xs text-slate-500">{t('tap.footnote')}</p>
      </main>
    </div>
  )
}
