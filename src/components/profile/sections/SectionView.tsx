import { ExternalLink } from 'lucide-react'
import type { Section, Theme } from '../../../types'
import { externalHref } from '../../../lib/links'
import { youtubeId } from '../../../lib/youtube'

export function SectionView({ section, theme }: { section: Section; theme: Theme }) {
  return (
    <section
      className="p-5"
      style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: theme.radius === '999px' ? '20px' : theme.radius }}
    >
      {section.title && <h2 className="mb-3 text-base font-semibold">{section.title}</h2>}
      <SectionBody section={section} theme={theme} />
    </section>
  )
}

function SectionBody({ section, theme }: { section: Section; theme: Theme }) {
  switch (section.type) {
    case 'text':
      return (
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: theme.muted }}>
          {section.body}
        </p>
      )
    case 'links': {
      const links = section.links.filter((l) => l.label && l.url)
      if (!links.length) return <Empty theme={theme} text="Belum ada tautan" />
      return (
        <div className="flex flex-col gap-2">
          {links.map((link) => (
            <a
              key={link.id}
              href={externalHref(link.url)}
              target="_blank"
              rel="noreferrer"
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
      if (!section.images.length) return <Empty theme={theme} text="Belum ada foto" />
      return (
        <div className="grid grid-cols-2 gap-2">
          {section.images.map((src, i) => (
            <img key={i} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
          ))}
        </div>
      )
    case 'video': {
      const id = youtubeId(section.url)
      if (!id) return <Empty theme={theme} text="Tautan YouTube belum valid" />
      return (
        <div className="aspect-video overflow-hidden rounded-lg">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${id}`}
            title={section.title || 'Video'}
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
