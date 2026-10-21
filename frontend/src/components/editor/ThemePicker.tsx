import { Check } from 'lucide-react'
import { themes } from '../../data/themes'
import { useI18n } from '../../i18n'
import { updateProfile, useProfile } from '../../store/profileStore'
import { PanelTitle } from './fields'

export function ThemePicker() {
  const { t } = useI18n()
  const profile = useProfile()

  return (
    <div>
      <PanelTitle title={t('theme.title')} description={t('theme.description')} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {themes.map((theme) => {
          const active = theme.id === profile.themeId
          return (
            <button
              key={theme.id}
              onClick={() => updateProfile({ themeId: theme.id })}
              aria-pressed={active}
              className={`overflow-hidden rounded-xl border-2 text-left transition ${active ? 'border-blue-600 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="relative p-3" style={{ background: theme.pageBg, fontFamily: theme.font }}>
                <div className="h-8 rounded-md" style={{ background: theme.coverBg }} />
                <div className="-mt-4 ml-2 h-8 w-8 rounded-full" style={{ background: theme.accent, border: `3px solid ${theme.pageBg}` }} />
                <div className="mt-2 h-2 w-16 rounded" style={{ background: theme.text }} />
                <div className="mt-1 h-2 w-10 rounded" style={{ background: theme.muted }} />
                <div className="mt-2 h-5" style={{ background: theme.accent, borderRadius: theme.radius }} />
                {active && (
                  <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Check size={14} />
                  </span>
                )}
              </div>
              <div className="border-t border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">{t(`theme.name.${theme.id}`)}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
