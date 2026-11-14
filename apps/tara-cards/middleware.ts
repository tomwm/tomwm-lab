import { gate } from './src/auth/gate.js'

// Provided by the Vercel runtime; declared here so the app's DOM-only type
// config needn't pull in all of @types/node.
declare const process: { env: Record<string, string | undefined> }

/**
 * Vercel Routing Middleware: runs before every request to this deployment,
 * including static files, so the question packs are never served to anyone
 * without the passcode. The logic lives in src/auth/gate.ts.
 *
 * Deliberately dependency-free: Vercel's edge bundler rejects packages it
 * cannot inline, and this file must deploy. `x-middleware-next: 1` is exactly
 * what @vercel/functions' `next()` returns — "continue to the requested file".
 */
export default async function middleware(request: Request) {
  const result = await gate(request, process.env.APP_PASSCODE)
  if (result.kind === 'next') {
    return new Response(null, {
      headers: { 'x-middleware-next': '1', 'x-robots-tag': 'noindex, nofollow' },
    })
  }
  return result.response
}
