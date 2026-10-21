import type { ProfileContent } from './profile'

export function emptyProfileContent(name = ''): ProfileContent {
  return {
    name,
    title: '',
    company: '',
    bio: '',
    phone: '',
    email: '',
    location: '',
    avatar: '',
    cover: '',
    socials: { instagram: '', linkedin: '', whatsapp: '', tiktok: '', youtube: '', website: '' },
    themeId: 'klasik',
    sections: [],
  }
}
