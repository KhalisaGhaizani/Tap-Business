import { Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ProfileView } from '../components/profile/ProfileView'
import { PageLoader } from '../components/ui'
import { useI18n } from '../i18n'
import { ApiError, publicApi } from '../lib/api'
import type { PublicProfile } from '../types'
import { MessagePage } from './MessagePage'

export function PublicProfilePage() {
  const { t } = useI18n()
  const { username = '' } = useParams()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [error, setError] = useState<'not-found' | 'failed' | null>(null)

  useEffect(() => {
    setProfile(null)
    setError(null)
    publicApi.profile(username).then(setProfile, (err) => setError(err instanceof ApiError && err.status === 404 ? 'not-found' : 'failed'))
  }, [username])

  useEffect(() => {
    if (profile) document.title = `${profile.name || profile.username} · TapBusiness`
    return () => {
      document.title = 'TapBusiness'
    }
  }, [profile])

  if (error === 'not-found') return <MessagePage title={t('profileView.notFound.title')} text={t('profileView.notFound.text')} />
  if (error) return <MessagePage title={t('errors.INTERNAL')} text={t('errors.NETWORK')} />
  if (!profile) return <PageLoader />

  const share = async () => {
    const url = window.location.href.split('?')[0]
    try {
      if (navigator.share) await navigator.share({ title: profile.name, url })
      else await navigator.clipboard.writeText(url)
    } catch {
      // the user closed the share sheet
    }
  }

  return (
    <div className="relative">
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          onClick={share}
          aria-label={t('profileView.share')}
          title={t('profileView.share')}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/25 text-white backdrop-blur hover:bg-black/40"
        >
          <Share2 size={16} />
        </button>
        <LanguageSwitcher dark className="bg-black/25 backdrop-blur" />
      </div>
      <ProfileView
        profile={profile}
        className="min-h-screen"
        vcardHref={publicApi.vcardUrl(profile.username)}
        onLinkClick={(target) => publicApi.trackClick(profile.username, target)}
      />
    </div>
  )
}
