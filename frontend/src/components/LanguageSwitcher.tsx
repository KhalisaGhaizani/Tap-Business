import { locales } from '@tapbusiness/shared'
import { Languages } from 'lucide-react'
import { useI18n } from '../i18n'

/** Compact EN / ID toggle. */
export function LanguageSwitcher({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  const { lang, setLang, t } = useI18n()
  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className={`inline-flex items-center gap-0.5 rounded-lg p-0.5 text-xs font-semibold ${dark ? 'bg-white/10' : 'bg-slate-100'} ${className}`}
    >
      <Languages size={14} className={`mx-1 ${dark ? 'text-white/70' : 'text-slate-500'}`} aria-hidden />
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          title={t(`lang.${l}`)}
          className={`rounded-md px-2 py-1 uppercase transition ${
            lang === l
              ? dark
                ? 'bg-white text-slate-900'
                : 'bg-white text-slate-900 shadow-sm'
              : dark
                ? 'text-white/80 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
