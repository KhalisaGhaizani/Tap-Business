import { ExternalLink } from 'lucide-react'
import { useI18n } from '../../../i18n'
import { externalHref } from '../../../lib/links'
import { youtubeId } from '../../../lib/youtube'
import type { Section, Theme } from '../../../types'

type LinkHandler = ((target: string) => void) | undefined

export function SectionView({ section, theme, onLinkClick }: { section: Section; theme: Theme; onLinkClick?: LinkHandler }) {
  return (
    <section
      className="p-5"
      style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: theme.radius === '999px' ? '20px' : theme.radius }}
    >
      {section.title && <h2 className="mb-3 text-base font-semibold">{section.title}</h2>}
      <SectionBody section={section} theme={theme} onLinkClick={onLinkClick} />
    </section>
  )
}

function SectionBody({ section, theme, onLinkClick }: { section: Section; theme: Theme; onLinkClick: LinkHandler }) {
  const { t } = useI18n()
  switch (section.type) {
    case 'text':
      return (
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: theme.muted }}>
          {section.body}
        </p>
      )
    case 'links': {
      const links = section.links.filter((l) => l.label && l.url)
      if (!links.length) return <Empty theme={theme} text={t('profileView.noLinks')} />
      return (
        <div className="flex flex-col gap-2">
          {links.map((link) => (
            <a
              key={link.id}
              href={externalHref(link.url)}
              target="_blank"
              rel="noreferrer"
              onClick={() => onLinkClick?.(link.label)}
              className="flex items-center justify-between px-4 py-3 text-sm font-medium transition hover:opacity-85"
              style={{ background: theme.accent, color: theme.accentText, borderRadius: theme.radius }}
            >
              {link.label}
              <ExternalLink size={16} />
            </a>
          ))}
        </div>
      )
    }
    case 'gallery':
      if (!section.images.length) return <Empty theme={theme} text={t('profileView.noPhotos')} />
      return (
        <div className="grid grid-cols-2 gap-2">
          {section.images.map((src, i) => (
            <a key={src + i} href={src} target="_blank" rel="noreferrer">
              <img src={src} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
            </a>
          ))}
        </div>
      )
    case 'video': {
      const id = youtubeId(section.url)
      if (!id) return <Empty theme={theme} text={t('profileView.invalidVideo')} />
      return (
        <div className="aspect-video overflow-hidden rounded-lg">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title={section.title || 'Video'}
            loading="lazy"
            allow="accelerometer; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }
  }
}

function Empty({ theme, text }: { theme: Theme; text: string }) {
  return (
    <p className="text-sm italic" style={{ color: theme.muted }}>
      {text}
    </p>
  )
}
