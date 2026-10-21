import type { AdminUserDetail } from '@tapbusiness/shared'
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  CreditCard,
  ExternalLink,
  EyeOff,
  Image,
  LayoutList,
  Link2,
  Loader2,
  LogOut,
  Nfc,
  Palette,
  Share2,
  UserCog,
  UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useState, type ComponentType } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AccountPanel } from '../components/editor/AccountPanel'
import { MediaForm } from '../components/editor/MediaForm'
import { PersonalInfoForm } from '../components/editor/PersonalInfoForm'
import { SectionsEditor } from '../components/editor/SectionsEditor'
import { SharePanel } from '../components/editor/SharePanel'
import { SocialLinksForm } from '../components/editor/SocialLinksForm'
import { ThemePicker } from '../components/editor/ThemePicker'
import { PanelTitle } from '../components/editor/fields'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Logo } from '../components/Logo'
import { PhoneFrame } from '../components/PhoneFrame'
import { ProfileView } from '../components/profile/ProfileView'
import { StatsPanel } from '../components/StatsPanel'
import { Alert, Button, CopyButton, PageLoader } from '../components/ui'
import { useI18n } from '../i18n'
import type { MessageKey } from '../i18n/en'
import { adminApi, profileApi, type AnalyticsDays } from '../lib/api'
import { hasUnsavedChanges, openProfile, useProfileState, useSaveStatus } from '../store/profileStore'

export type EditorMode = { kind: 'self' } | { kind: 'admin'; userId: string }

interface Tab {
  id: string
  label: MessageKey
  icon: ComponentType<{ size?: number }>
  panel: ComponentType<{ base: string }>
  /** content tabs show the live phone preview beside them */
  preview: boolean
  selfOnly?: boolean
}

function StatsTab({ base }: { base: string }) {
  const { t } = useI18n()
  const load = useCallback((days: AnalyticsDays) => profileApi(base).analytics(days), [base])
  return (
    <div>
      <PanelTitle title={t('stats.title')} description={t('stats.description')} />
      <StatsPanel load={load} />
    </div>
  )
}

const tabs: Tab[] = [
  { id: 'info', label: 'editor.tab.info', icon: UserRound, panel: PersonalInfoForm, preview: true },
  { id: 'social', label: 'editor.tab.social', icon: Link2, panel: SocialLinksForm, preview: true },
  { id: 'media', label: 'editor.tab.media', icon: Image, panel: MediaForm, preview: true },
  { id: 'sections', label: 'editor.tab.sections', icon: LayoutList, panel: SectionsEditor, preview: true },
  { id: 'theme', label: 'editor.tab.theme', icon: Palette, panel: ThemePicker, preview: true },
  { id: 'share', label: 'editor.tab.share', icon: Share2, panel: SharePanel, preview: false },
  { id: 'stats', label: 'editor.tab.stats', icon: BarChart3, panel: StatsTab, preview: false },
  { id: 'account', label: 'editor.tab.account', icon: UserCog, panel: AccountPanel, preview: false, selfOnly: true },
]

export function EditorPage({ mode }: { mode: EditorMode }) {
  const { t } = useI18n()
  const { tab: tabId = 'info' } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { base, loadStatus, profile } = useProfileState()
  const [customer, setCustomer] = useState<AdminUserDetail | null>(null)

  const wantedBase = mode.kind === 'self' ? '/api/me' : `/api/admin/users/${mode.userId}`
  const rootPath = mode.kind === 'self' ? '/edit' : `/admin/users/${mode.userId}/edit`
  const visibleTabs = tabs.filter((tab) => mode.kind === 'self' || !tab.selfOnly)
  const tab = visibleTabs.find((tab) => tab.id === tabId)

  useEffect(() => {
    void openProfile(wantedBase)
  }, [wantedBase])

  const adminUserId = mode.kind === 'admin' ? mode.userId : null
  useEffect(() => {
    if (adminUserId) adminApi.user(adminUserId).then(setCustomer, () => {})
  }, [adminUserId])

  // warn before closing the tab while a save is still pending
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) e.preventDefault()
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [])

  if (!tab) return <Navigate to={rootPath} replace />
  if (base !== wantedBase || loadStatus === 'loading') return <PageLoader />
  if (loadStatus === 'error' || !profile) {
    return (
      <div className="mx-auto max-w-md p-8">
        <Alert kind="error">
          {t('editor.loadFailed')}{' '}
          <button className="font-semibold underline" onClick={() => openProfile(wantedBase)}>
            {t('common.retry')}
          </button>
        </Alert>
      </div>
    )
  }

  const publicPath = `/u/${profile.username}`
  const publicUrl = window.location.origin + publicPath

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to={mode.kind === 'self' ? '/' : '/admin'}>
            <Logo />
          </Link>

          <div className="order-last flex w-full items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1 pr-1 pl-3 text-sm sm:order-none sm:ml-4 sm:w-auto">
            <span className="truncate text-slate-600">
              {window.location.host}
              {publicPath}
            </span>
            {!profile.published && (
              <span className="ml-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                <EyeOff size={12} /> {t('editor.hiddenBadge')}
              </span>
            )}
            <CopyButton text={publicUrl} className="ml-auto" />
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-md px-2 py-1 font-medium text-slate-700 hover:bg-white"
              title={t('editor.openProfile')}
            >
              <ExternalLink size={14} /> {t('common.open')}
            </a>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <SaveIndicator />
            <LanguageSwitcher className="hidden sm:inline-flex" />
            {mode.kind === 'self' && (
              <Link
                to="/tap"
                className="hidden items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 md:flex"
              >
                <Nfc size={16} /> {t('editor.tapSim')}
              </Link>
            )}
            {mode.kind === 'self' ? (
              <Button
                variant="ghost"
                className="!px-3 !py-1.5"
                title={user?.email}
                onClick={async () => {
                  await logout()
                  navigate('/login')
                }}
              >
                <LogOut size={16} /> <span className="hidden sm:inline">{t('common.logout')}</span>
              </Button>
            ) : (
              <Link
                to={`/admin/users/${mode.userId}`}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft size={16} /> <span className="hidden sm:inline">{t('editor.backToAccount')}</span>
              </Link>
            )}
          </div>
        </div>
        {mode.kind === 'admin' && (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
            {t('editor.adminBanner', { name: customer?.name ?? profile.name })}
          </div>
        )}
      </header>

      <div className={`mx-auto grid max-w-7xl gap-6 px-4 py-6 ${tab.preview ? 'lg:grid-cols-[220px_minmax(0,1fr)_340px]' : 'lg:grid-cols-[220px_minmax(0,1fr)]'}`}>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {visibleTabs.map((item) => (
            <Link
              key={item.id}
              to={item.id === 'info' ? rootPath : `${rootPath}/${item.id}`}
              aria-current={item.id === tab.id ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                item.id === tab.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <item.icon size={16} /> {t(item.label)}
            </Link>
          ))}

          {profile.cardId && (
            <div className="mt-4 hidden rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 lg:block">
              <div className="mb-1 flex items-center gap-1 font-semibold text-slate-800">
                <CreditCard size={14} /> {t('share.card')}
              </div>
              <div className="font-mono">{profile.cardId}</div>
            </div>
          )}
        </nav>

        <main className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <tab.panel base={base} />
        </main>

        {tab.preview && (
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-center text-xs font-semibold tracking-wide text-slate-400 uppercase">{t('editor.livePreview')}</p>
            <PhoneFrame>
              <ProfileView profile={profile} />
            </PhoneFrame>
          </aside>
        )}
      </div>
    </div>
  )
}

function SaveIndicator() {
  const { t } = useI18n()
  const status = useSaveStatus()
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
        <Loader2 size={14} className="animate-spin" /> {t('common.saving')}
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-amber-600" title={t('editor.saveErrorHint')}>
        <AlertTriangle size={14} /> {t('common.saveFailed')}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
      <Check size={14} /> {t('common.saved')}
    </span>
  )
}
