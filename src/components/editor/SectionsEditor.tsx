import { ArrowDown, ArrowUp, Eye, EyeOff, Images, Link2, Plus, Trash2, Type, Video, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { newId, updateProfile, useProfile } from '../../store/profileStore'
import type { Section, SectionType } from '../../types'
import { youtubeId } from '../../lib/youtube'
import { Field, inputClass, PanelTitle, TextArea, TextInput } from './fields'
import { ImageUpload } from './ImageUpload'

const sectionTypes: { type: SectionType; label: string; description: string; icon: typeof Type }[] = [
  { type: 'text', label: 'Teks / Tentang', description: 'Paragraf bebas dengan judul', icon: Type },
  { type: 'links', label: 'Daftar Tautan', description: 'Tombol ke portofolio, CV, toko, dll.', icon: Link2 },
  { type: 'gallery', label: 'Galeri Foto', description: 'Kumpulan foto atau gambar', icon: Images },
  { type: 'video', label: 'Video YouTube', description: 'Sematkan video dari YouTube', icon: Video },
]

const typeInfo = (type: SectionType) => sectionTypes.find((t) => t.type === type)!

function createSection(type: SectionType): Section {
  const base = { id: newId(), visible: true }
  switch (type) {
    case 'text':
      return { ...base, type, title: 'Tentang Saya', body: '' }
    case 'links':
      return { ...base, type, title: 'Tautan', links: [{ id: newId(), label: '', url: '' }] }
    case 'gallery':
      return { ...base, type, title: 'Galeri', images: [] }
    case 'video':
      return { ...base, type, title: 'Video', url: '' }
  }
}

export function SectionsEditor() {
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
    const section = createSection(type)
    setSections((list) => [...list, section])
    setOpenId(section.id)
    setMenuOpen(false)
  }

  return (
    <div>
      <PanelTitle title="Bagian" description="Tambahkan konten ke profil, lalu atur urutan dan visibilitasnya." />

      <div className="flex flex-col gap-3">
        {sections.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Belum ada bagian. Klik <b>Tambah Bagian</b> untuk mulai.
          </p>
        )}

        {sections.map((section, i) => {
          const info = typeInfo(section.type)
          const open = openId === section.id
          return (
            <div key={section.id} className={`rounded-xl border bg-white ${open ? 'border-blue-300 shadow-sm' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2 p-3">
                <button onClick={() => setOpenId(open ? null : section.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <info.icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate text-sm font-medium ${section.visible ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                      {section.title || '(tanpa judul)'}
                    </span>
                    <span className="block text-xs text-slate-500">{info.label}</span>
                  </span>
                </button>
                <IconButton label="Naikkan" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp size={16} />
                </IconButton>
                <IconButton label="Turunkan" disabled={i === sections.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown size={16} />
                </IconButton>
                <IconButton label={section.visible ? 'Sembunyikan' : 'Tampilkan'} onClick={() => patch(section.id, { visible: !section.visible })}>
                  {section.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </IconButton>
                <IconButton
                  label="Hapus"
                  danger
                  onClick={() => confirm(`Hapus bagian "${section.title || info.label}"?`) && setSections((list) => list.filter((s) => s.id !== section.id))}
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>

              {open && (
                <div className="flex flex-col gap-4 border-t border-slate-100 p-4">
                  <Field label="Judul bagian">
                    <TextInput value={section.title} onChange={(e) => patch(section.id, { title: e.target.value })} />
                  </Field>
                  <SectionFields section={section} onChange={(c) => patch(section.id, c)} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="relative mt-4">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          <Plus size={18} /> Tambah Bagian
        </button>
        {menuOpen && (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {sectionTypes.map((t) => (
              <button
                key={t.type}
                onClick={() => add(t.type)}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <t.icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{t.label}</span>
                  <span className="block text-xs text-slate-500">{t.description}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionFields({ section, onChange }: { section: Section; onChange: (c: Partial<Section>) => void }) {
  switch (section.type) {
    case 'text':
      return (
        <Field label="Isi">
          <TextArea value={section.body} onChange={(e) => onChange({ body: e.target.value })} placeholder="Tulis sesuatu…" />
        </Field>
      )

    case 'links': {
      const setLinks = (links: typeof section.links) => onChange({ links })
      return (
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Tautan</span>
          <div className="flex flex-col gap-2">
            {section.links.map((link) => (
              <div key={link.id} className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder="Teks tombol"
                  value={link.label}
                  onChange={(e) => setLinks(section.links.map((l) => (l.id === link.id ? { ...l, label: e.target.value } : l)))}
                />
                <input
                  className={inputClass}
                  placeholder="https://…"
                  value={link.url}
                  onChange={(e) => setLinks(section.links.map((l) => (l.id === link.id ? { ...l, url: e.target.value } : l)))}
                />
                <IconButton label="Hapus tautan" danger onClick={() => setLinks(section.links.filter((l) => l.id !== link.id))}>
                  <X size={16} />
                </IconButton>
              </div>
            ))}
          </div>
          <button
            onClick={() => setLinks([...section.links, { id: newId(), label: '', url: '' }])}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            <Plus size={14} /> Tambah tautan
          </button>
        </div>
      )
    }

    case 'gallery':
      return (
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Foto</span>
          {section.images.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {section.images.map((src, i) => (
                <div key={i} className="group relative">
                  <img src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  <button
                    onClick={() => onChange({ images: section.images.filter((_, j) => j !== i) })}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                    title="Hapus foto"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <ImageUpload multiple maxSize={700} onUpload={(urls) => onChange({ images: [...section.images, ...urls] })} />
        </div>
      )

    case 'video': {
      const valid = !section.url || youtubeId(section.url)
      return (
        <Field label="Tautan YouTube" hint={valid ? 'Contoh: https://www.youtube.com/watch?v=…' : 'Tautan tidak dikenali sebagai video YouTube'}>
          <TextInput value={section.url} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://youtu.be/…" />
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
