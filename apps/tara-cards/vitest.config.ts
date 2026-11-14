import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // The monorepo root can hoist an older React for other apps. Process the
    // testing library through Vite so it shares this app's single React.
    server: { deps: { inline: [/@testing-library/, /dexie-react-hooks/] } },
  },
  resolve: {
    // Pin every import of React to this app's own copy (19), whatever the
    // monorepo root happens to have hoisted for other apps.
    alias: [
      { find: '@', replacement: resolve(here, './src') },
      { find: /^react$/, replacement: resolve(here, 'node_modules/react/index.js') },
      { find: /^react\/(.*)$/, replacement: resolve(here, 'node_modules/react/$1') },
      { find: /^react-dom$/, replacement: resolve(here, 'node_modules/react-dom/index.js') },
      { find: /^react-dom\/(.*)$/, replacement: resolve(here, 'node_modules/react-dom/$1') },
    ],
    dedupe: ['react', 'react-dom'],
  },
})
