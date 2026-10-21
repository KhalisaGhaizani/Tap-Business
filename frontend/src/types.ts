import type { ThemeId } from '@tapbusiness/shared'

export type {
  GallerySection,
  LinkItem,
  LinksSection,
  Profile,
  ProfileContent,
  PublicProfile,
  Section,
  SectionType,
  SocialKey,
  TextSection,
  ThemeId,
  VideoSection,
} from '@tapbusiness/shared'

export interface Theme {
  id: ThemeId
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
