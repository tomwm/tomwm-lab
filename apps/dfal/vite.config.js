import { defineConfig } from 'vite'

// The knob is shared with Isobeats (../isobeats/src/knob.js).
// src/bus.js is the patch bus that other patchable synths import from here.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/dfal/' : '/',
  build: {
    outDir: '../../dist/dfal',
    emptyOutDir: true,
  },
  server: {
    port: parseInt(process.env.PORT || '5185'),
    strictPort: true,
  },
}))
