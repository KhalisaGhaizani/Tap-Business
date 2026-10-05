export type SocialKey = 'instagram' | 'linkedin' | 'whatsapp' | 'tiktok' | 'youtube' | 'website'

export interface LinkItem {
  id: string
  label: string
  url: string
}

interface SectionBase {
  id: string
  title: string
  visible: boolean
}

export interface TextSection extends SectionBase {
  type: 'text'
  body: string
}

export interface LinksSection extends SectionBase {
  type: 'links'
  links: LinkItem[]
}

export interface GallerySection extends SectionBase {
  type: 'gallery'
  images: string[]
}

export interface VideoSection extends SectionBase {
  type: 'video'
  url: string
}

export type Section = TextSection | LinksSection | GallerySection | VideoSection
export type SectionType = Section['type']

export interface Profile {
  username: string
  cardId: string
  name: string
  title: string
  company: string
  bio: string
  phone: string
  email: string
  location: string
  avatar: string
  cover: string
  socials: Record<SocialKey, string>
  themeId: string
  sections: Section[]
}

export interface Theme {
  id: string
  name: string
  font: string
  pageBg: string
  coverBg: string
  cardBg: string
  text: string
  muted: string
  accent: string
  accentText: string
  border: string
  radius: string
}
