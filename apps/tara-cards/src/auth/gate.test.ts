// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { BASE, COOKIE, LOGIN_PATH, LOGOUT_PATH, authToken, gate, safeNext } from './gate'

const PASS = 'correct horse battery staple'
const noSleep = async () => {}

const get = (path: string, cookie?: string) =>
  new Request(`https://example.test${path}`, cookie ? { headers: { cookie } } : undefined)

const login = (passcode: string, next = `${BASE}/progress`) =>
  new Request(`https://example.test${LOGIN_PATH}`, {
    method: 'POST',
    body: new URLSearchParams({ passcode, next }),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  })

describe('passcode gate', () => {
  it('fails closed when no passcode is configured', async () => {
    const r = await gate(get(`${BASE}/`), undefined, noSleep)
    expect(r.kind).toBe('response')
    if (r.kind === 'response') expect(r.response.status).toBe(503)
  })

  it('serves the login page, not the app, to a visitor without a cookie', async () => {
    const r = await gate(get(`${BASE}/library`), PASS, noSleep)
    expect(r.kind).toBe('response')
    if (r.kind !== 'response') return
    expect(r.response.status).toBe(401)
    const html = await r.response.text()
    expect(html).toContain('name="passcode"')
    expect(html).toContain(`value="${BASE}/library"`)
  })

  it('protects the question files, not just the page', async () => {
    const r = await gate(get(`${BASE}/assets/tara-tsa-abc123.json`), PASS, noSleep)
    expect(r.kind).toBe('response')
    if (r.kind === 'response') expect(r.response.status).toBe(401)
  })

  it('rejects a wrong passcode without setting a cookie', async () => {
    const r = await gate(login('guess'), PASS, noSleep)
    if (r.kind !== 'response') throw new Error('expected a response')
    expect(r.response.status).toBe(401)
    expect(r.response.headers.get('set-cookie')).toBeNull()
    expect(await r.response.text()).toContain('That passcode is not right.')
  })

  it('accepts the right passcode, sets a secure cookie and returns to where the learner was', async () => {
    const r = await gate(login(PASS), PASS, noSleep)
    if (r.kind !== 'response') throw new Error('expected a response')
    expect(r.response.status).toBe(303)
    expect(r.response.headers.get('location')).toBe(`${BASE}/progress`)
    const cookie = r.response.headers.get('set-cookie')!
    expect(cookie).toContain(`${COOKIE}=${await authToken(PASS)}`)
    expect(cookie).toMatch(/HttpOnly/)
    expect(cookie).toMatch(/Secure/)
    expect(cookie).toMatch(/SameSite=Lax/)
    expect(cookie).toContain(`Path=${BASE}`)
  })

  it('redirects with a relative path so the learner stays on lab.tomwm.co.uk', async () => {
    const r = await gate(login(PASS), PASS, noSleep)
    if (r.kind !== 'response') throw new Error('expected a response')
    expect(r.response.headers.get('location')!.startsWith('/')).toBe(true)
  })

  it('lets a valid cookie through to the content', async () => {
    const r = await gate(get(`${BASE}/assets/tara-tsa-abc123.json`, `${COOKIE}=${await authToken(PASS)}`), PASS, noSleep)
    expect(r.kind).toBe('next')
  })

  it('refuses a forged cookie', async () => {
    const r = await gate(get(`${BASE}/`, `${COOKIE}=${'0'.repeat(64)}`), PASS, noSleep)
    expect(r.kind).toBe('response')
  })

  it('signs everyone out when the passcode changes', async () => {
    const oldCookie = `${COOKIE}=${await authToken('old passcode')}`
    const r = await gate(get(`${BASE}/`, oldCookie), PASS, noSleep)
    expect(r.kind).toBe('response')
  })

  it('clears the cookie on sign-out', async () => {
    const r = await gate(get(LOGOUT_PATH), PASS, noSleep)
    if (r.kind !== 'response') throw new Error('expected a response')
    expect(r.response.status).toBe(303)
    expect(r.response.headers.get('set-cookie')).toContain('Max-Age=0')
  })

  it('never sends the learner off-site after logging in', () => {
    expect(safeNext('https://evil.example/')).toBe(`${BASE}/`)
    expect(safeNext('//evil.example/')).toBe(`${BASE}/`)
    expect(safeNext('/elsewhere')).toBe(`${BASE}/`)
    expect(safeNext(`${BASE}/practice?skill=ct-flaws`)).toBe(`${BASE}/practice?skill=ct-flaws`)
  })

  it('escapes the return path in the login form', async () => {
    const r = await gate(get(`${BASE}/"><script>alert(1)</script>`), PASS, noSleep)
    if (r.kind !== 'response') throw new Error('expected a response')
    expect(await r.response.text()).not.toContain('<script>alert(1)</script>')
  })
})
