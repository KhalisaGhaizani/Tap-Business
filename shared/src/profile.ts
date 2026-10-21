import { z } from 'zod'
import { LIMITS, themeIds } from './constants'

// Images are always files uploaded to our own server
export const imageUrl = z.string().regex(/^\/uploads\/[\w-]+\.(?:jpg|png|webp)$/, 'INVALID_IMAGE')
const optionalImage = z.union([z.literal(''), imageUrl])
const text = (max: number) => z.string().trim().max(max)

const linkItem = z.object({
  id: z.string().max(40),
  label: text(80),
  url: text(2000),
})

const sectionBase = {
  id: z.string().max(40),
  title: text(80),
  visible: z.boolean(),
}

export const sectionSchema = z.discriminatedUnion('type', [
  z.object({ ...sectionBase, type: z.literal('text'), body: text(5000) }),
  z.object({ ...sectionBase, type: z.literal('links'), links: z.array(linkItem).max(LIMITS.linksPerSection) }),
  z.object({ ...sectionBase, type: z.literal('gallery'), images: z.array(imageUrl).max(LIMITS.galleryImages) }),
  z.object({ ...sectionBase, type: z.literal('video'), url: text(500) }),
])

export const profileContentSchema = z.object({
  name: text(80),
  title: text(80),
  company: text(80),
  bio: text(LIMITS.bio),
  phone: text(40),
  email: text(120),
  location: text(80),
  avatar: optionalImage,
  cover: optionalImage,
  socials: z.object({
    instagram: text(300),
    linkedin: text(300),
    whatsapp: text(300),
    tiktok: text(300),
    youtube: text(300),
    website: text(300),
  }),
  themeId: z.enum(themeIds),
  sections: z.array(sectionSchema).max(LIMITS.sections),
})

export type Section = z.infer<typeof sectionSchema>
export type SectionType = Section['type']
export type TextSection = Extract<Section, { type: 'text' }>
export type LinksSection = Extract<Section, { type: 'links' }>
export type GallerySection = Extract<Section, { type: 'gallery' }>
export type VideoSection = Extract<Section, { type: 'video' }>
export type LinkItem = z.infer<typeof linkItem>
export type ProfileContent = z.infer<typeof profileContentSchema>

/** Profile as the owner sees it in the editor. */
export interface Profile extends ProfileContent {
  username: string
  cardId: string | null
  published: boolean
}

/** Profile as anyone sees it at /u/:username. */
export interface PublicProfile extends ProfileContent {
  username: string
}
