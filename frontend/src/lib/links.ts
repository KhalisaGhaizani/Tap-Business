import type { SocialKey } from '../types'

// brand names stay the same in every language; 'website' is translated where shown in the editor

export const socialLabels: Record<SocialKey, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  website: 'Website',
}

export const socialPlaceholders: Record<SocialKey, string> = {
  instagram: 'username',
  linkedin: 'https://linkedin.com/in/...',
  whatsapp: '6281234567890',
  tiktok: 'username',
  youtube: 'https://youtube.com/@...',
  website: 'https://...',
}

const withProtocol = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`)

export function socialHref(key: SocialKey, value: string): string {
  const v = value.trim().replace(/^@/, '')
  switch (key) {
    case 'instagram':
      return v.includes('/') ? withProtocol(v) : `https://instagram.com/${v}`
    case 'tiktok':
      return v.includes('/') ? withProtocol(v) : `https://tiktok.com/@${v}`
    case 'whatsapp':
      return `https://wa.me/${v.replace(/\D/g, '').replace(/^0/, '62')}`
    default:
      return withProtocol(v)
  }
}

export const externalHref = withProtocol
