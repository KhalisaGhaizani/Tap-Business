import { Mail, MapPin, Phone } from 'lucide-react'
import type { Profile, SocialKey } from '../../types'
import { getTheme } from '../../data/themes'
import { socialHref, socialLabels } from '../../lib/links'
import { SocialIcon } from './SocialIcon'
import { SectionView } from './sections/SectionView'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

export function ProfileView({ profile, className = 'min-h-full' }: { profile: Profile; className?: string }) {
  const theme = getTheme(profile.themeId)
  const socials = (Object.keys(profile.socials) as SocialKey[]).filter((k) => profile.socials[k].trim())
  const contacts = [
    profile.phone && { icon: Phone, label: 'Telepon', href: `tel:${profile.phone.replace(/[^\d+]/g, '')}` },
    profile.email && { icon: Mail, label: 'Email', href: `mailto:${profile.email}` },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href: string }[]

  return (
    <div className={`${className} pb-10`} style={{ background: theme.pageBg, color: theme.text, fontFamily: theme.font }}>
      <div
        className="h-36 w-full bg-cover bg-center"
        style={{ background: profile.cover ? `center / cover url(${profile.cover})` : theme.coverBg }}
      />

      <div className="mx-auto -mt-14 flex max-w-md flex-col items-center px-5 text-center">
        <div
          className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full text-3xl font-bold"
          style={{ border: `4px solid ${theme.pageBg}`, background: theme.accent, color: theme.accentText }}
        >
          {profile.avatar ? <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" /> : initials(profile.name) || '?'}
        </div>

        <h1 className="mt-4 text-2xl font-bold">{profile.name || 'Nama Anda'}</h1>
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

        {socials.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {socials.map((key) => (
              <a
                key={key}
                href={socialHref(key, profile.socials[key])}
                target="_blank"
                rel="noreferrer"
                title={socialLabels[key]}
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
              <SectionView key={s.id} section={s} theme={theme} />
            ))}
        </div>

        <p className="mt-8 text-xs" style={{ color: theme.muted }}>
          Dibuat dengan <span className="font-semibold">TapBusiness</span>
        </p>
      </div>
    </div>
  )
}
