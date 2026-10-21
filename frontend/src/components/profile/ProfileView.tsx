import { socialKeys } from '@tapbusiness/shared'
import { Mail, MapPin, Phone, UserPlus } from 'lucide-react'
import { getTheme } from '../../data/themes'
import { useI18n } from '../../i18n'
import { socialHref, socialLabels } from '../../lib/links'
import type { ProfileContent } from '../../types'
import { SocialIcon } from './SocialIcon'
import { SectionView } from './sections/SectionView'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

export function ProfileView({
  profile,
  className = 'min-h-full',
  vcardHref,
  onLinkClick,
}: {
  profile: ProfileContent
  className?: string
  /** Download link for the contact card; without it the button is only a preview. */
  vcardHref?: string
  onLinkClick?: (target: string) => void
}) {
  const { t } = useI18n()
  const theme = getTheme(profile.themeId)
  const socials = socialKeys.filter((k) => profile.socials[k].trim())
  const contacts = [
    profile.phone && { icon: Phone, label: t('profileView.call'), href: `tel:${profile.phone.replace(/[^\d+]/g, '')}` },
    profile.email && { icon: Mail, label: t('profileView.email'), href: `mailto:${profile.email}` },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href: string }[]
  const hasContact = Boolean(profile.phone || profile.email)
  const saveContactClass = 'mt-2 flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition hover:opacity-85'
  const saveContactStyle = { background: theme.cardBg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: theme.radius }

  return (
    <div className={`${className} pb-10`} style={{ background: theme.pageBg, color: theme.text, fontFamily: theme.font }}>
      <div className="h-36 w-full" style={{ background: profile.cover ? `center / cover url(${profile.cover})` : theme.coverBg }} />

      <div className="mx-auto -mt-14 flex max-w-md flex-col items-center px-5 text-center">
        <div
          className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full text-3xl font-bold"
          style={{ border: `4px solid ${theme.pageBg}`, background: theme.accent, color: theme.accentText }}
        >
          {profile.avatar ? <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" /> : initials(profile.name) || '?'}
        </div>

        <h1 className="mt-4 text-2xl font-bold">{profile.name || t('common.yourName')}</h1>
        {(profile.title || profile.company) && (
          <p className="mt-1 text-sm font-medium" style={{ color: theme.accent }}>
            {[profile.title, profile.company].filter(Boolean).join(' · ')}
          </p>
        )}
        {profile.location && (
          <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: theme.muted }}>
            <MapPin size={13} /> {profile.location}
          </p>
        )}
        {profile.bio && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: theme.muted }}>
            {profile.bio}
          </p>
        )}

        {contacts.length > 0 && (
          <div className="mt-5 grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${contacts.length}, 1fr)` }}>
            {contacts.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition hover:opacity-85"
                style={{ background: theme.accent, color: theme.accentText, borderRadius: theme.radius }}
              >
                <Icon size={16} /> {label}
              </a>
            ))}
          </div>
        )}
        {hasContact &&
          (vcardHref ? (
            <a href={vcardHref} className={saveContactClass} style={saveContactStyle}>
              <UserPlus size={16} /> {t('profileView.saveContact')}
            </a>
          ) : (
            <span className={saveContactClass} style={saveContactStyle}>
              <UserPlus size={16} /> {t('profileView.saveContact')}
            </span>
          ))}

        {socials.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {socials.map((key) => (
              <a
                key={key}
                href={socialHref(key, profile.socials[key])}
                target="_blank"
                rel="noreferrer"
                title={socialLabels[key]}
                aria-label={socialLabels[key]}
                onClick={() => onLinkClick?.(socialLabels[key])}
                className="flex h-11 w-11 items-center justify-center transition hover:opacity-75"
                style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: theme.radius === '0px' ? '0px' : '999px' }}
              >
                <SocialIcon name={key} />
              </a>
            ))}
          </div>
        )}

        <div className="mt-6 flex w-full flex-col gap-3 text-left">
          {profile.sections
            .filter((s) => s.visible)
            .map((s) => (
              <SectionView key={s.id} section={s} theme={theme} onLinkClick={onLinkClick} />
            ))}
        </div>

        <p className="mt-8 text-xs" style={{ color: theme.muted }}>
          {t('profileView.madeWith')}{' '}
          <a href="/" className="font-semibold hover:underline">
            TapBusiness
          </a>
        </p>
      </div>
    </div>
  )
}
