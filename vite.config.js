import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base './' keeps asset URLs relative so the build works at any hosting path
// (GitHub Pages subpath, local file, etc.)
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // Offline support: precache the app shell so it opens with no signal.
    // The manifest is the hand-written one in public/, not plugin-generated.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      includeAssets: ['favicon.svg', 'icon.svg', 'icon-192.png', 'icons.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
})
