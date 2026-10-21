import type { Locale } from '@tapbusiness/shared'
import type { PublicProfile } from '../types'

const shared = {
  username: 'andi',
  name: 'Andi Pratama',
  title: 'Product Designer',
  company: 'Studio Nusantara',
  phone: '+62 812 3456 7890',
  email: 'andi@studionusantara.id',
  avatar: '',
  cover: '',
  socials: {
    instagram: 'andipratama',
    linkedin: 'https://linkedin.com/in/andipratama',
    whatsapp: '6281234567890',
    tiktok: '',
    youtube: '',
    website: 'https://studionusantara.id',
  },
  themeId: 'klasik',
} satisfies Partial<PublicProfile>

/** Example profile shown on the landing page and in the tap simulation. */
export const demoProfiles: Record<Locale, PublicProfile> = {
  id: {
    ...shared,
    bio: 'Membantu brand lokal tumbuh lewat desain produk digital yang sederhana dan berdampak.',
    location: 'Jakarta, Indonesia',
    sections: [
      {
        id: 's-about',
        type: 'text',
        title: 'Tentang Saya',
        visible: true,
        body: 'Berpengalaman 6 tahun di bidang UI/UX untuk startup fintech dan e-commerce. Saat ini terbuka untuk kolaborasi dan proyek freelance.',
      },
      {
        id: 's-links',
        type: 'links',
        title: 'Tautan Penting',
        visible: true,
        links: [
          { id: 'l1', label: 'Lihat Portofolio', url: 'https://studionusantara.id/portfolio' },
          { id: 'l2', label: 'Unduh CV', url: 'https://studionusantara.id/cv.pdf' },
        ],
      },
    ],
  },
  en: {
    ...shared,
    bio: 'Helping local brands grow through simple, meaningful digital product design.',
    location: 'Jakarta, Indonesia',
    sections: [
      {
        id: 's-about',
        type: 'text',
        title: 'About Me',
        visible: true,
        body: '6 years of UI/UX experience for fintech and e-commerce startups. Currently open to collaborations and freelance projects.',
      },
      {
        id: 's-links',
        type: 'links',
        title: 'Useful Links',
        visible: true,
        links: [
          { id: 'l1', label: 'View Portfolio', url: 'https://studionusantara.id/portfolio' },
          { id: 'l2', label: 'Download CV', url: 'https://studionusantara.id/cv.pdf' },
        ],
      },
    ],
  },
}
