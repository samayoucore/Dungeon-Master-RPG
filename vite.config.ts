import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built app works from any GitHub Pages sub-path
  // (e.g. username.github.io/<repo>/) without hard-coding the repo name.
  // Safe here because the app has no client-side routing / deep links.
  base: './',
  plugins: [react(), tailwindcss()],
})
