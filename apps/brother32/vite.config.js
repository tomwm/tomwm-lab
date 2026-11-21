import { defineConfig } from 'vite'

// The patch bus, rack UI and controls come from DFAL (../dfal/src), the knob
// from Isobeats (../isobeats/src/knob.js).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/brother32/' : '/',
  build: {
    outDir: '../../dist/brother32',
    emptyOutDir: true,
  },
  server: {
    port: parseInt(process.env.PORT || '5186'),
    strictPort: true,
  },
}))
