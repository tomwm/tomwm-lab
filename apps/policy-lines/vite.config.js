import { defineConfig } from 'vite'

export default defineConfig({
  base: '/policy-lines',
  build: {
    outDir: '../../dist/policy-lines',
    emptyOutDir: true,
  },
})
