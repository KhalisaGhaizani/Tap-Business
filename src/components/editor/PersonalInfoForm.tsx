import { updateProfile, useProfile } from '../../store/profileStore'
import type { Profile } from '../../types'
import { Field, PanelTitle, TextArea, TextInput } from './fields'

type TextKey = 'name' | 'title' | 'company' | 'location' | 'phone' | 'email' | 'bio'

export function PersonalInfoForm() {
  const profile = useProfile()
  const bind = (key: TextKey) => ({
    value: profile[key],
    onChange: (e: { target: { value: string } }) => updateProfile({ [key]: e.target.value } as Partial<Profile>),
  })

  return (
    <div>
      <PanelTitle title="Informasi Pribadi" description="Data utama yang muncul di bagian atas profil Anda." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama lengkap">
          <TextInput {...bind('name')} placeholder="Nama Anda" />
        </Field>
        <Field label="Jabatan">
          <TextInput {...bind('title')} placeholder="mis. Marketing Manager" />
        </Field>
        <Field label="Perusahaan / Instansi">
          <TextInput {...bind('company')} />
        </Field>
        <Field label="Lokasi">
          <TextInput {...bind('location')} placeholder="Kota, Negara" />
        </Field>
        <Field label="Nomor telepon">
          <TextInput {...bind('phone')} type="tel" placeholder="+62 ..." />
        </Field>
        <Field label="Email">
          <TextInput {...bind('email')} type="email" placeholder="nama@email.com" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Deskripsi singkat" hint={`${profile.bio.length}/200 karakter`}>
            <TextArea {...bind('bio')} maxLength={200} rows={3} placeholder="Ceritakan sedikit tentang diri Anda" />
          </Field>
        </div>
      </div>
    </div>
  )
}
