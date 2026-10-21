import { LIMITS } from '@tapbusiness/shared'
import { useI18n } from '../../i18n'
import { updateProfile, useProfile } from '../../store/profileStore'
import type { Profile } from '../../types'
import { Field, PanelTitle, TextArea, TextInput } from './fields'

type TextKey = 'name' | 'title' | 'company' | 'location' | 'phone' | 'email' | 'bio'

export function PersonalInfoForm() {
  const { t } = useI18n()
  const profile = useProfile()
  const bind = (key: TextKey) => ({
    value: profile[key],
    onChange: (e: { target: { value: string } }) => updateProfile({ [key]: e.target.value } as Partial<Profile>),
  })

  return (
    <div>
      <PanelTitle title={t('info.title')} description={t('info.description')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('info.name')}>
          <TextInput {...bind('name')} maxLength={80} placeholder={t('common.yourName')} />
        </Field>
        <Field label={t('info.jobTitle')}>
          <TextInput {...bind('title')} maxLength={80} placeholder={t('info.jobTitlePlaceholder')} />
        </Field>
        <Field label={t('info.company')}>
          <TextInput {...bind('company')} maxLength={80} />
        </Field>
        <Field label={t('info.location')}>
          <TextInput {...bind('location')} maxLength={80} placeholder={t('info.locationPlaceholder')} />
        </Field>
        <Field label={t('info.phone')}>
          <TextInput {...bind('phone')} maxLength={40} type="tel" placeholder="+62 ..." />
        </Field>
        <Field label={t('info.email')}>
          <TextInput {...bind('email')} maxLength={120} type="email" placeholder={t('info.emailPlaceholder')} />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t('info.bio')} hint={t('info.bioCount', { n: profile.bio.length, max: LIMITS.bio })}>
            <TextArea {...bind('bio')} maxLength={LIMITS.bio} rows={3} placeholder={t('info.bioPlaceholder')} />
          </Field>
        </div>
      </div>
    </div>
  )
}
