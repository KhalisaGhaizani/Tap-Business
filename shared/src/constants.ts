// Plain constants, kept apart from the zod schemas so pages that only need these
// (like the public profile) don't pull zod into their bundle.

export const socialKeys = ['instagram', 'linkedin', 'whatsapp', 'tiktok', 'youtube', 'website'] as const
export const themeIds = ['klasik', 'malam', 'elegan', 'segar', 'senja', 'mono'] as const

export const LIMITS = {
  bio: 200,
  sections: 30,
  linksPerSection: 20,
  galleryImages: 24,
  uploadBytes: 3 * 1024 * 1024,
} as const

export const locales = ['en', 'id'] as const
export type Locale = (typeof locales)[number]

export const roles = ['admin', 'customer'] as const
export type Role = (typeof roles)[number]

export const userStatuses = ['pending', 'active', 'disabled'] as const
export type UserStatus = (typeof userStatuses)[number]

export type SocialKey = (typeof socialKeys)[number]
export type ThemeId = (typeof themeIds)[number]
