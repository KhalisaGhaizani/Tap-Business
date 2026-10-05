import { updateProfile, useProfile } from '../../store/profileStore'
import type { SocialKey } from '../../types'
import { socialLabels, socialPlaceholders } from '../../lib/links'
import { SocialIcon } from '../profile/SocialIcon'
import { inputClass, PanelTitle } from './fields'

export function SocialLinksForm() {
  const profile = useProfile()
  const keys = Object.keys(socialLabels) as SocialKey[]

  return (
    <div>
      <PanelTitle
        title="Media Sosial & Tautan"
        description="Isi akun yang ingin ditampilkan. Kolom yang kosong tidak akan muncul di profil."
      />
      <div className="flex flex-col gap-3">
        {keys.map((key) => (
          <label key={key} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <SocialIcon name={key} />
            </span>
            <span className="w-24 shrink-0 text-sm font-medium text-slate-700">{socialLabels[key]}</span>
            <input
              className={inputClass}
              value={profile.socials[key]}
              placeholder={socialPlaceholders[key]}
              onChange={(e) => updateProfile((p) => ({ socials: { ...p.socials, [key]: e.target.value } }))}
            />
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Butuh tombol tautan lain (portofolio, CV, toko online)? Tambahkan bagian <b>Daftar Tautan</b> di tab Bagian.
      </p>
    </div>
  )
}
