import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/bozzmobil/',
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ['**/public/cars/**'],
    },
  },
})
