import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        birthday: 'index.html',
        gallery: 'gallery.html',
      },
    },
  },
})