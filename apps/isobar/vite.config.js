import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/isobar/' : '/',
  build: {
    outDir: '../../dist/isobar',
    emptyOutDir: true,
  },
  server: {
    port: parseInt(process.env.PORT || '5182'),
    strictPort: true,
  },
}))
