import { LIMITS } from '@tapbusiness/shared'
import { ArrowDown, ArrowUp, Eye, EyeOff, Images, Link2, Plus, Trash2, Type, Video, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useI18n, type Translate } from '../../i18n'
import { youtubeId } from '../../lib/youtube'
import { newId, updateProfile, useProfile } from '../../store/profileStore'
import type { Section, SectionType } from '../../types'
import { Field, inputClass, PanelTitle, TextArea, TextInput } from './fields'
import { ImageUpload } from './ImageUpload'

const sectionTypes: { type: SectionType; icon: typeof Type }[] = [
  { type: 'text', icon: Type },
  { type: 'links', icon: Link2 },
  { type: 'gallery', icon: Images },
  { type: 'video', icon: Video },
]

const typeIcon = (type: SectionType) => sectionTypes.find((s) => s.type === type)!.icon

function createSection(type: SectionType, t: Translate): Section {
  const base = { id: newId(), visible: true, title: t(`sections.type.${type}.default`) }
  switch (type) {
    case 'text':
      return { ...base, type, body: '' }
    case 'links':
      return { ...base, type, links: [{ id: newId(), label: '', url: '' }] }
    case 'gallery':
      return { ...base, type, images: [] }
    case 'video':
      return { ...base, type, url: '' }
  }
}

export function SectionsEditor() {
  const { t } = useI18n()
  const { sections } = useProfile()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const setSections = (fn: (s: Section[]) => Section[]) => updateProfile((p) => ({ sections: fn(p.sections) }))
  const patch = (id: string, changes: Partial<Section>) =>
    setSections((list) => list.map((s) => (s.id === id ? ({ ...s, ...changes } as Section) : s)))
  const move = (index: number, dir: -1 | 1) =>
    setSections((list) => {
      const next = [...list]
      ;[next[index], next[index + dir]] = [next[index + dir], next[index]]
      return next
    })

  const add = (type: SectionType) => {
    const section = createSection(type, t)
    setSections((list) => [...list, section])
    setOpenId(section.id)
    setMenuOpen(false)
  }

  return (
    <div>
      <PanelTitle title={t('sections.title')} description={t('sections.description')} />

      <div className="flex flex-col gap-3">
        {sections.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{t('sections.empty')}</p>
        )}

        {sections.map((section, i) => {
          const Icon = typeIcon(section.type)
          const label = t(`sections.type.${section.type}.label`)
          const open = openId === section.id
          return (
            <div key={section.id} className={`rounded-xl border bg-white ${open ? 'border-blue-300 shadow-sm' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2 p-3">
                <button onClick={() => setOpenId(open ? null : section.id)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate text-sm font-medium ${section.visible ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                      {section.title || t('common.untitled')}
                    </span>
                    <span className="block text-xs text-slate-500">{label}</span>
                  </span>
                </button>
                <IconButton label={t('sections.moveUp')} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp size={16} />
                </IconButton>
                <IconButton label={t('sections.moveDown')} disabled={i === sections.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown size={16} />
                </IconButton>
                <IconButton label={section.visible ? t('sections.hide') : t('sections.show')} onClick={() => patch(section.id, { visible: !section.visible })}>
                  {section.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </IconButton>
                <IconButton
                  label={t('sections.delete')}
                  danger
                  onClick={() =>
                    confirm(t('sections.confirmDelete', { title: section.title || label })) &&
                    setSections((list) => list.filter((s) => s.id !== section.id))
                  }
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>

              {open && (
                <div className="flex flex-col gap-4 border-t border-slate-100 p-4">
                  <Field label={t('sections.sectionTitle')}>
                    <TextInput value={section.title} maxLength={80} onChange={(e) => patch(section.id, { title: e.target.value })} />
                  </Field>
                  <SectionFields section={section} onChange={(c) => patch(section.id, c)} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {sections.length < LIMITS.sections && (
        <div className="relative mt-4">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            <Plus size={18} /> {t('sections.add')}
          </button>
          {menuOpen && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {sectionTypes.map(({ type, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => add(type)}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-blue-300 hover:bg-blue-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{t(`sections.type.${type}.label`)}</span>
                    <span className="block text-xs text-slate-500">{t(`sections.type.${type}.description`)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionFields({ section, onChange }: { section: Section; onChange: (c: Partial<Section>) => void }) {
  const { t } = useI18n()
  switch (section.type) {
    case 'text':
      return (
        <Field label={t('sections.body')}>
          <TextArea value={section.body} maxLength={5000} onChange={(e) => onChange({ body: e.target.value })} placeholder={t('sections.bodyPlaceholder')} />
        </Field>
      )

    case 'links': {
      const setLinks = (links: typeof section.links) => onChange({ links })
      return (
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">{t('sections.links')}</span>
          <div className="flex flex-col gap-2">
            {section.links.map((link) => (
              <div key={link.id} className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder={t('sections.linkLabel')}
                  maxLength={80}
                  value={link.label}
                  onChange={(e) => setLinks(section.links.map((l) => (l.id === link.id ? { ...l, label: e.target.value } : l)))}
                />
                <input
                  className={inputClass}
                  placeholder="https://…"
                  maxLength={2000}
                  value={link.url}
                  onChange={(e) => setLinks(section.links.map((l) => (l.id === link.id ? { ...l, url: e.target.value } : l)))}
                />
                <IconButton label={t('sections.removeLink')} danger onClick={() => setLinks(section.links.filter((l) => l.id !== link.id))}>
                  <X size={16} />
                </IconButton>
              </div>
            ))}
          </div>
          {section.links.length < LIMITS.linksPerSection && (
            <button
              onClick={() => setLinks([...section.links, { id: newId(), label: '', url: '' }])}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
            >
              <Plus size={14} /> {t('sections.addLink')}
            </button>
          )}
        </div>
      )
    }

    case 'gallery': {
      const room = LIMITS.galleryImages - section.images.length
      return (
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">{t('sections.photos')}</span>
          {section.images.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {section.images.map((src, i) => (
                <div key={src + i} className="group relative">
                  <img src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  <button
                    onClick={() => onChange({ images: section.images.filter((_, j) => j !== i) })}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                    title={t('sections.removePhoto')}
                    aria-label={t('sections.removePhoto')}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {room > 0 && (
            <ImageUpload multiple maxSize={1000} onUpload={(urls) => onChange({ images: [...section.images, ...urls].slice(0, LIMITS.galleryImages) })} />
          )}
          <p className="mt-2 text-xs text-slate-500">{t('sections.galleryLimit', { max: LIMITS.galleryImages })}</p>
        </div>
      )
    }

    case 'video': {
      const valid = !section.url || youtubeId(section.url)
      return (
        <Field label={t('sections.youtubeUrl')} hint={t('sections.youtubeHint')} error={valid ? undefined : t('sections.youtubeInvalid')}>
          <TextInput value={section.url} maxLength={500} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://youtu.be/…" />
        </Field>
      )
    }
  }
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition disabled:opacity-30 ${danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-slate-100 hover:text-slate-900'}`}
    >
      {children}
    </button>
  )
}
