/**
 * Serve the production build locally behind the same passcode gate that
 * middleware.ts runs on Vercel, so the login flow can be checked end to end
 * before deploying.
 *
 *   npm run build && APP_PASSCODE=something node scripts/preview-gated.mjs
 *   open http://localhost:5190/tara-cards/
 *
 * Needs Node 23.6+ (it imports src/auth/gate.ts directly).
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gate } from '../src/auth/gate.ts'

const root = fileURLToPath(new URL('../dist', import.meta.url))
const port = Number(process.env.PORT ?? 5190)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }

async function serveStatic(pathname) {
  let file = normalize(join(root, decodeURIComponent(pathname)))
  if (!file.startsWith(root)) return new Response('Forbidden', { status: 403 })
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
    return new Response(await readFile(file), { headers: { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' } })
  } catch {
    // Single-page app fallback, as vercel.json rewrites do.
    if (pathname.startsWith('/tara-cards/')) {
      return new Response(await readFile(join(root, 'tara-cards/index.html')), { headers: { 'content-type': TYPES['.html'] } })
    }
    return new Response('Not found', { status: 404 })
  }
}

createServer(async (req, res) => {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const request = new Request(`http://localhost:${port}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
  })
  const result = await gate(request, process.env.APP_PASSCODE)
  const url = new URL(request.url)
  const response = result.kind === 'response'
    ? result.response
    : url.pathname === '/' ? new Response(null, { status: 302, headers: { location: '/tara-cards/' } })
    : await serveStatic(url.pathname)
  const headers = {}
  response.headers.forEach((v, k) => { headers[k] = k === 'set-cookie' ? v.replace('; Secure', '') : v })
  res.writeHead(response.status, headers)
  res.end(Buffer.from(await response.arrayBuffer()))
}).listen(port, () => console.log(`Gated preview on http://localhost:${port}/tara-cards/`))
