import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/isotones/' : '/',
  build: {
    outDir: '../../dist/isotones',
    emptyOutDir: true,
  },
  server: {
    port: parseInt(process.env.PORT || '5182'),
    strictPort: true,
  },
}))
