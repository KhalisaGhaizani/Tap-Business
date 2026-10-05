import { Link, useParams } from 'react-router-dom'
import { ProfileView } from '../components/profile/ProfileView'
import { useProfile } from '../store/profileStore'

export function PublicProfilePage() {
  const { username } = useParams()
  const profile = useProfile()

  if (username !== profile.username) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Profil tidak ditemukan</h1>
        <p className="text-slate-600">Tautan profil ini belum terdaftar ke kartu mana pun.</p>
        <Link to="/" className="mt-2 font-semibold text-blue-600 hover:underline">
          Kembali ke beranda
        </Link>
      </div>
    )
  }

  return (
    <ProfileView profile={profile} className="min-h-screen" />
  )
}
