import { Download, Eye, EyeOff, Nfc } from 'lucide-react'
import { useI18n } from '../../i18n'
import { publicApi } from '../../lib/api'
import { updateProfile, useProfile } from '../../store/profileStore'
import { QrCode } from '../QrCode'
import { CopyField } from '../ui'
import { PanelTitle } from './fields'

export function SharePanel() {
  const { t } = useI18n()
  const profile = useProfile()
  const profileUrl = `${window.location.origin}/u/${profile.username}`
  const cardUrl = profile.cardId ? `${window.location.origin}/c/${profile.cardId}` : null

  return (
    <div>
      <PanelTitle title={t('share.title')} description={t('share.description')} />

      <div className="flex flex-col gap-6">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('share.visibility')}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {[true, false].map((published) => {
              const active = profile.published === published
              const Icon = published ? Eye : EyeOff
              return (
                <button
                  key={String(published)}
                  onClick={() => updateProfile({ published })}
                  aria-pressed={active}
                  className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition ${active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <Icon size={18} className={active ? 'mt-0.5 text-blue-600' : 'mt-0.5 text-slate-400'} />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{published ? t('share.public') : t('share.hidden')}</span>
                    <span className="block text-xs text-slate-500">{published ? t('share.publicHint') : t('share.hiddenHint')}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('share.profileLink')}</h3>
          <CopyField value={profileUrl} />
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-800">{t('share.qr')}</h3>
          <p className="mb-3 text-xs text-slate-500">{t('share.qrHint')}</p>
          <QrCode value={profileUrl} fileName={`tapbusiness-${profile.username}`} />
        </section>

        <section className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Nfc size={16} /> {t('share.card')}
          </h3>
          {cardUrl ? (
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <span className="text-xs text-slate-500">{t('share.cardId')}</span>
                <div className="font-mono font-semibold text-slate-900">{profile.cardId}</div>
              </div>
              <div>
                <span className="text-xs text-slate-500">{t('share.cardUrl')}</span>
                <CopyField value={cardUrl} />
              </div>
              <p className="text-xs text-slate-500">{t('share.cardHint')}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t('share.noCard')}</p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-800">{t('share.vcard')}</h3>
          <p className="mb-2 text-xs text-slate-500">{t('share.vcardHint')}</p>
          <a
            href={publicApi.vcardUrl(profile.username)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download size={16} /> {profile.username}.vcf
          </a>
        </section>
      </div>
    </div>
  )
}
