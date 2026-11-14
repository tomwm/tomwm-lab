/**
 * Passcode gate for the deployed app.
 *
 * The deployed build contains the imported official papers, which UAT-UK does
 * not allow to be shared. So every request — the page, its scripts, and the
 * question files — is checked here before anything is served. A gate inside
 * the React app would protect nothing: the files would still be downloadable.
 *
 * Kept free of framework and Vercel imports so it can be unit-tested with plain
 * Request objects. `middleware.ts` at the project root wires it to Vercel.
 */

export const BASE = '/tara-cards'
export const COOKIE = 'tara_auth'
export const LOGIN_PATH = `${BASE}/__login`
export const LOGOUT_PATH = `${BASE}/__logout`
const MAX_AGE = 60 * 60 * 24 * 30
const FAIL_DELAY_MS = 800

export type GateResult = { kind: 'next' } | { kind: 'response'; response: Response }

const encoder = new TextEncoder()

/** The cookie value: an HMAC keyed by the passcode, so changing it signs everyone out. */
export async function authToken(passcode: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode('tara-cards:v1'))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Compare without leaking how many leading characters matched. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

/** Only ever send someone back to a path inside this app. */
export function safeNext(value: string | null): string {
  if (!value || !value.startsWith(`${BASE}/`) || value.startsWith('//') || value.includes('\\')) {
    return `${BASE}/`
  }
  if (value.startsWith(LOGIN_PATH) || value.startsWith(LOGOUT_PATH)) return `${BASE}/`
  return value
}

function cookieHeader(value: string, maxAge: number): string {
  return `${COOKIE}=${value}; Path=${BASE}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function loginPage(next: string, error: string | null, status = 401): Response {
  const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>TARA Cards</title>
<style>
  :root { color-scheme: light dark; --bg:#faf8f4; --card:#fff; --fg:#221f1c; --muted:#5f594f; --border:#cdc6b6; --primary:#4a3f6b; --on:#fbf9f5; --danger:#9d3838; }
  @media (prefers-color-scheme: dark) { :root { --bg:#18161a; --card:#211f24; --fg:#f0ece5; --muted:#b3ab9f; --border:#4c4754; --primary:#b3a6de; --on:#1c1826; --danger:#e09a9a; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; padding:16px; background:var(--bg); color:var(--fg); font:16px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { width:100%; max-width:360px; background:var(--card); border:1px solid var(--border); border-radius:16px; padding:28px 24px; }
  h1 { margin:0 0 4px; font-size:20px; }
  p { margin:0 0 20px; color:var(--muted); font-size:14px; }
  label { display:block; font-size:14px; font-weight:600; margin-bottom:6px; }
  input { width:100%; font:inherit; padding:10px 12px; border:1px solid var(--border); border-radius:10px; background:var(--bg); color:var(--fg); }
  input:focus-visible, button:focus-visible { outline:2px solid var(--primary); outline-offset:2px; }
  button { margin-top:14px; width:100%; font:inherit; font-weight:600; padding:10px 12px; border:0; border-radius:10px; background:var(--primary); color:var(--on); cursor:pointer; }
  .error { color:var(--danger); font-size:14px; margin:10px 0 0; }
</style>
</head>
<body>
<main>
  <h1>TARA Cards</h1>
  <p>A private study app. Enter the passcode to continue.</p>
  <form method="post" action="${LOGIN_PATH}">
    <input type="hidden" name="next" value="${escapeHtml(next)}">
    <label for="passcode">Passcode</label>
    <input id="passcode" name="passcode" type="password" autocomplete="current-password" required autofocus>
    ${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ''}
    <button type="submit">Continue</button>
  </form>
</main>
</body>
</html>`
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  })
}

/**
 * Decide what happens to a request.
 *
 * Fails closed: with no passcode configured, nothing is served. Redirects use
 * relative Location headers, so behind the lab.tomwm.co.uk rewrite the learner
 * stays on that domain rather than being bounced to the *.vercel.app host.
 */
export async function gate(
  request: Request,
  passcode: string | undefined,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<GateResult> {
  if (!passcode) {
    return {
      kind: 'response',
      response: new Response('TARA Cards is not configured: set APP_PASSCODE for this deployment.', {
        status: 503,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      }),
    }
  }

  const url = new URL(request.url)
  const path = url.pathname
  const expected = await authToken(passcode)

  if (path === LOGOUT_PATH) {
    return {
      kind: 'response',
      response: new Response(null, {
        status: 303,
        headers: { location: `${BASE}/`, 'set-cookie': cookieHeader('', 0), 'cache-control': 'no-store' },
      }),
    }
  }

  if (path === LOGIN_PATH && request.method === 'POST') {
    const form = await request.formData().catch(() => null)
    const given = String(form?.get('passcode') ?? '')
    const next = safeNext(String(form?.get('next') ?? ''))
    if (given && safeEqual(await authToken(given), expected)) {
      return {
        kind: 'response',
        response: new Response(null, {
          status: 303,
          headers: { location: next, 'set-cookie': cookieHeader(expected, MAX_AGE), 'cache-control': 'no-store' },
        }),
      }
    }
    await sleep(FAIL_DELAY_MS)
    return { kind: 'response', response: loginPage(next, 'That passcode is not right.') }
  }

  const cookie = readCookie(request, COOKIE)
  if (cookie && safeEqual(cookie, expected)) return { kind: 'next' }

  // Anything else — the page, a script, a question file — gets the login page
  // in place of the content. Only navigations need the form; for everything
  // else the 401 status is what matters.
  return { kind: 'response', response: loginPage(safeNext(path + url.search), null) }
}
