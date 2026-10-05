import { AlertTriangle, Check, Copy, CreditCard, ExternalLink, Image, LayoutList, Link2, Nfc, Palette, RotateCcw, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { PhoneFrame } from '../components/PhoneFrame'
import { ProfileView } from '../components/profile/ProfileView'
import { MediaForm } from '../components/editor/MediaForm'
import { PersonalInfoForm } from '../components/editor/PersonalInfoForm'
import { SectionsEditor } from '../components/editor/SectionsEditor'
import { SocialLinksForm } from '../components/editor/SocialLinksForm'
import { ThemePicker } from '../components/editor/ThemePicker'
import { resetProfile, useProfile, useSaveStatus } from '../store/profileStore'

const tabs = [
  { id: 'info', label: 'Informasi Pribadi', icon: UserRound, panel: PersonalInfoForm },
  { id: 'social', label: 'Media Sosial & Tautan', icon: Link2, panel: SocialLinksForm },
  { id: 'media', label: 'Media', icon: Image, panel: MediaForm },
  { id: 'sections', label: 'Bagian', icon: LayoutList, panel: SectionsEditor },
  { id: 'theme', label: 'Tema', icon: Palette, panel: ThemePicker },
]

export function EditorPage() {
  const profile = useProfile()
  const saveStatus = useSaveStatus()
  const [tabId, setTabId] = useState(tabs[0].id)
  const [copied, setCopied] = useState(false)
  const tab = tabs.find((t) => t.id === tabId)!
  const publicPath = `/u/${profile.username}`
  const displayUrl = `tapbusiness.id${publicPath}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + publicPath)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard may be blocked; ignore in the demo
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/">
            <Logo />
          </Link>

          <div className="order-last flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1 pr-1 pl-3 text-sm sm:order-none sm:ml-4 sm:w-auto">
            <span className="truncate text-slate-600">{displayUrl}</span>
            <button onClick={copyLink} className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 font-medium text-slate-700 hover:bg-white" title="Salin tautan">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Disalin' : 'Salin'}
            </button>
            <Link to={publicPath} target="_blank" className="flex items-center gap-1 rounded-md px-2 py-1 font-medium text-slate-700 hover:bg-white" title="Buka profil publik">
              <ExternalLink size={14} /> Buka
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {saveStatus === 'saved' ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check size={14} /> Tersimpan
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-600" title="Penyimpanan browser penuh. Coba hapus beberapa gambar.">
                <AlertTriangle size={14} /> Gagal menyimpan
              </span>
            )}
            <Link to="/tap" className="hidden items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:flex">
              <Nfc size={16} /> Simulasi Tap
            </Link>
            <button
              onClick={() => confirm('Kembalikan profil ke data demo? Semua perubahan akan hilang.') && resetProfile()}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <RotateCcw size={16} /> <span className="hidden sm:inline">Reset ke Demo</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)_340px]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTabId(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                t.id === tabId ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}

          <div className="mt-4 hidden rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 lg:block">
            <div className="mb-1 flex items-center gap-1 font-semibold text-slate-800">
              <CreditCard size={14} /> Kartu terdaftar
            </div>
            <div className="font-mono">{profile.cardId}</div>
            <div className="mt-1 text-slate-500">Terhubung ke {displayUrl}</div>
          </div>
        </nav>

        <main className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <tab.panel />
        </main>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-center text-xs font-semibold tracking-wide text-slate-400 uppercase">Pratinjau langsung</p>
          <PhoneFrame>
            <ProfileView profile={profile} />
          </PhoneFrame>
        </aside>
      </div>
    </div>
  )
}
