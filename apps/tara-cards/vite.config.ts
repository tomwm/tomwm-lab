import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/tara-cards/',
  build: {
    // Deployed as its own Vercel project (behind the passcode middleware), so
    // the output stays inside the app: dist/ is the deploy root and the app
    // lives under /tara-cards/ within it, matching the base path.
    outDir: 'dist/tara-cards',
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5181,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(here, './src') },
    // The monorepo root hoists React 18 for other apps; libraries installed
    // there (dexie-react-hooks) would otherwise bundle a second React beside
    // this app's 19, and hooks crash in the production build.
    dedupe: ['react', 'react-dom'],
  },
})
