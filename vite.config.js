import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps asset URLs relative so the build works at any hosting path
// (GitHub Pages subpath, local file, etc.)
export default defineConfig({
  base: './',
  plugins: [react()],
})
