import { defineConfig } from 'vite'

// One dev server for all the patchable synths, so their windows share an
// address and can reach each other over the patch bus:
//   http://localhost:5187/dfal/  and  http://localhost:5187/brother32/
// (Each app's own dev server works on its own, but can't patch to the others.)
export default defineConfig({
  root: new URL('..', import.meta.url).pathname,
  optimizeDeps: { entries: ['dfal/index.html', 'brother32/index.html'] },
  server: { port: 5187, strictPort: true },
})
