import { ArrowRight, Nfc, PenLine, Smartphone, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useProfile } from '../store/profileStore'

const steps = [
  { icon: Nfc, title: 'Kartu terdaftar', text: 'Kartu NFC yang Anda beli sudah dihubungkan ke profil pribadi oleh penjual.' },
  { icon: PenLine, title: 'Atur profil di website', text: 'Ubah informasi, tautan, media, dan tema kapan saja tanpa perlu tap kartu.' },
  { icon: Smartphone, title: 'Tap & bagikan', text: 'Tempelkan kartu ke smartphone. Penerima langsung melihat profil terbaru Anda.' },
]

export function HomePage() {
  const profile = useProfile()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Logo />
        <Link to="/edit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          Masuk ke Editor
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-10 pb-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            <Nfc size={14} /> Kartu nama NFC + profil digital
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Satu tap, seluruh informasi Anda.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Setiap kartu TapBusiness terhubung ke profil digital pribadi. Perbarui isinya kapan saja dari website, dan perubahan langsung terlihat saat kartu di-tap.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/edit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
              <PenLine size={18} /> Buka Editor Profil
            </Link>
            <Link to="/tap" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50">
              <Smartphone size={18} /> Simulasi Tap Kartu
            </Link>
            <Link to={`/u/${profile.username}`} className="inline-flex items-center gap-2 px-2 py-3 font-semibold text-slate-600 hover:text-slate-900">
              <UserRound size={18} /> Lihat profil publik <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <s.icon size={20} />
                </span>
                <span className="text-xs font-semibold text-slate-400">LANGKAH {i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-500">
          Kartu dibeli melalui marketplace mitra. Website ini digunakan untuk mengelola profil digital Anda.
        </p>
      </main>
    </div>
  )
}
