import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const api = process.env.API_URL ?? 'http://localhost:3000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // same paths Caddy forwards to the backend in production
    proxy: {
      '/api': api,
      '/uploads': api,
      '^/c/': api,
    },
  },
})
