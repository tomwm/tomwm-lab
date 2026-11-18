import { defineConfig } from 'vite'

// Weather, map and recording code is shared with Isobar (../isobar/src).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/isobeats/' : '/',
  build: {
    outDir: '../../dist/isobeats',
    emptyOutDir: true,
  },
  server: {
    port: parseInt(process.env.PORT || '5183'),
    strictPort: true,
  },
}))
