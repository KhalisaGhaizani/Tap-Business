import { ArrowLeft, Nfc } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PhoneFrame } from '../components/PhoneFrame'
import { getTheme } from '../data/themes'
import { useProfile } from '../store/profileStore'

type Stage = 'idle' | 'tapping' | 'notified'

export function TapSimulationPage() {
  const profile = useProfile()
  const theme = getTheme(profile.themeId)
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('idle')
  const profileUrl = `tapbusiness.id/u/${profile.username}`

  useEffect(() => {
    if (stage === 'tapping') {
      const t = setTimeout(() => setStage('notified'), 1200)
      return () => clearTimeout(t)
    }
    if (stage === 'notified') {
      const t = setTimeout(() => navigate(`/u/${profile.username}`), 1600)
      return () => clearTimeout(t)
    }
  }, [stage, navigate, profile.username])

  const now = new Date()
  const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-5xl items-center px-4 py-5">
        <Link to="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> Kembali
        </Link>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-16">
        <h1 className="text-center text-2xl font-bold sm:text-3xl">Simulasi Tap Kartu NFC</h1>
        <p className="mt-2 max-w-lg text-center text-slate-400">
          Beginilah yang dilihat penerima saat Anda menempelkan kartu TapBusiness ke smartphone mereka.
        </p>

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
                <div className="text-xl font-bold">{profile.name || 'Nama Anda'}</div>
                <div className="text-sm opacity-80">{profile.title}</div>
              </div>
              <div className="font-mono text-[10px] opacity-60">{profile.cardId}</div>
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
                      NFC · sekarang
                    </div>
                    <div className="mt-1 text-sm font-semibold">Membuka profil {profile.name}…</div>
                    <div className="truncate text-xs text-slate-500">{profileUrl}</div>
                  </div>
                )
              }
            >
              <div className="flex h-full flex-col items-center bg-gradient-to-b from-slate-700 to-slate-900 pt-20 text-white">
                <div className="text-6xl font-light">{time}</div>
                <div className="mt-2 text-sm opacity-70">
                  {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="mt-auto mb-16 flex flex-col items-center gap-2 text-xs opacity-60">
                  <Nfc size={22} />
                  Dekatkan kartu NFC
                </div>
              </div>
            </PhoneFrame>
          </div>
        </div>

        <button
          onClick={() => setStage('tapping')}
          disabled={stage !== 'idle'}
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
        >
          <Nfc size={20} /> {stage === 'idle' ? 'Tap Kartu' : 'Membaca kartu…'}
        </button>
        <p className="mt-3 text-xs text-slate-500">Profil yang terbuka selalu versi terbaru dari editor.</p>
      </main>
    </div>
  )
}
