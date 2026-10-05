import { Trash2 } from 'lucide-react'
import { getTheme } from '../../data/themes'
import { updateProfile, useProfile } from '../../store/profileStore'
import { PanelTitle } from './fields'
import { ImageUpload } from './ImageUpload'

export function MediaForm() {
  const profile = useProfile()
  const theme = getTheme(profile.themeId)

  return (
    <div>
      <PanelTitle title="Media" description="Foto profil dan gambar sampul. Untuk galeri foto, tambahkan bagian Galeri di tab Bagian." />

      <div className="flex flex-col gap-6">
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Foto profil</h3>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs text-slate-500">
              {profile.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : 'Kosong'}
            </div>
            <div className="flex gap-2">
              <ImageUpload maxSize={400} onUpload={([url]) => updateProfile({ avatar: url })} />
              {profile.avatar && <RemoveButton onClick={() => updateProfile({ avatar: '' })} />}
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Gambar sampul</h3>
          <div
            className="mb-3 h-28 w-full rounded-xl"
            style={{ background: profile.cover ? `center / cover url(${profile.cover})` : theme.coverBg }}
          />
          <div className="flex gap-2">
            <ImageUpload maxSize={1200} onUpload={([url]) => updateProfile({ cover: url })} />
            {profile.cover && <RemoveButton onClick={() => updateProfile({ cover: '' })} />}
          </div>
          {!profile.cover && <p className="mt-2 text-xs text-slate-500">Tanpa gambar, sampul memakai warna dari tema.</p>}
        </div>
      </div>
    </div>
  )
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
    >
      <Trash2 size={16} /> Hapus
    </button>
  )
}
