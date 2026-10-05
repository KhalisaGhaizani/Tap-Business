import type { Profile } from '../types'

export const demoProfile: Profile = {
  username: 'andi',
  cardId: 'TB-0001',
  name: 'Andi Pratama',
  title: 'Product Designer',
  company: 'Studio Nusantara',
  bio: 'Membantu brand lokal tumbuh lewat desain produk digital yang sederhana dan berdampak.',
  phone: '+62 812 3456 7890',
  email: 'andi@studionusantara.id',
  location: 'Jakarta, Indonesia',
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
}
