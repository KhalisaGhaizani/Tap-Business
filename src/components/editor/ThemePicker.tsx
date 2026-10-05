import { Check } from 'lucide-react'
import { themes } from '../../data/themes'
import { updateProfile, useProfile } from '../../store/profileStore'
import { PanelTitle } from './fields'

export function ThemePicker() {
  const profile = useProfile()

  return (
    <div>
      <PanelTitle title="Tema" description="Pilih tampilan profil. Perubahan langsung terlihat di pratinjau." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {themes.map((t) => {
          const active = t.id === profile.themeId
          return (
            <button
              key={t.id}
              onClick={() => updateProfile({ themeId: t.id })}
              className={`overflow-hidden rounded-xl border-2 text-left transition ${active ? 'border-blue-600 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="relative p-3" style={{ background: t.pageBg, fontFamily: t.font }}>
                <div className="h-8 rounded-md" style={{ background: t.coverBg }} />
                <div className="-mt-4 ml-2 h-8 w-8 rounded-full" style={{ background: t.accent, border: `3px solid ${t.pageBg}` }} />
                <div className="mt-2 h-2 w-16 rounded" style={{ background: t.text }} />
                <div className="mt-1 h-2 w-10 rounded" style={{ background: t.muted }} />
                <div className="mt-2 h-5" style={{ background: t.accent, borderRadius: t.radius }} />
                {active && (
                  <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check size={14} />
                  </span>
                )}
              </div>
              <div className="border-t border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">{t.name}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
