import { defineConfig } from 'vite'

// Link, ticker and place-search code is shared with Isotones (../isotones/src).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/isobars/' : '/',
  build: {
    outDir: '../../dist/isobars',
    emptyOutDir: true,
  },
  server: {
    port: parseInt(process.env.PORT || '5184'),
    strictPort: true,
  },
}))
