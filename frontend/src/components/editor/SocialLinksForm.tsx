import { socialKeys } from '@tapbusiness/shared'
import { useI18n } from '../../i18n'
import { socialLabels, socialPlaceholders } from '../../lib/links'
import { updateProfile, useProfile } from '../../store/profileStore'
import { SocialIcon } from '../profile/SocialIcon'
import { inputClass, PanelTitle } from './fields'

export function SocialLinksForm() {
  const { t } = useI18n()
  const profile = useProfile()

  return (
    <div>
      <PanelTitle title={t('social.title')} description={t('social.description')} />
      <div className="flex flex-col gap-3">
        {socialKeys.map((key) => (
          <label key={key} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <SocialIcon name={key} />
            </span>
            <span className="w-24 shrink-0 text-sm font-medium text-slate-700">{key === 'website' ? t('social.website') : socialLabels[key]}</span>
            <input
              className={inputClass}
              value={profile.socials[key]}
              maxLength={300}
              placeholder={socialPlaceholders[key]}
              onChange={(e) => updateProfile((p) => ({ socials: { ...p.socials, [key]: e.target.value } }))}
            />
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">{t('social.hint')}</p>
    </div>
  )
}
