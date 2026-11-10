/**
 * Minimal read-only client for the Garmin Connect Personal API.
 *
 * Auth flow (ported from apratico/garmin-mcp's GarminApiClient, MIT):
 *   personal API key -> POST token endpoint -> access token (valid ~24h, no
 *   refresh token) -> "Authorization: Bearer ..." on every GET.
 * The token is held in memory only, renewed before expiry and after a 401.
 *
 * This module only ever issues GET requests (plus the one token POST), so the
 * integration is read-only by construction. It must only run on the server:
 * the key and token never reach browser code.
 */
import { readFile } from 'node:fs/promises'
import { API_KEY_FILE, GARMIN_BASE_URL } from './config'

const TOKEN_PATH = '/personalapitoken-service/personal-api/personal-api-key/token'
const DEFAULT_TOKEN_TTL_MS = 23 * 60 * 60 * 1000

export type GarminErrorKind =
  | 'no-key' // no API key configured yet
  | 'auth' // key rejected, expired or revoked
  | 'not-found' // no record for that id/date
  | 'rate-limit'
  | 'http' // any other non-2xx
  | 'network'
  | 'parse'

export class GarminError extends Error {
  constructor(
    readonly kind: GarminErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'GarminError'
  }
}

type TokenState = { token: string; expiresAt: number }

// Survive Next.js dev hot reloads so we don't request a new token per edit.
const g = globalThis as unknown as {
  __garminToken?: TokenState
  __garminTokenPending?: Promise<string>
}

/**
 * Garmin allows about 100 requests per minute and answers 429 with
 * {"retryInSeconds": n} beyond that. Space requests out to stay under the
 * limit, and if we hit it anyway, wait as told and try again.
 */
const MIN_GAP_MS = 700
const MAX_429_RETRIES = 4
const pace = (globalThis as unknown as { __garminPace?: { next: number } }).__garminPace ??= { next: 0 }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function takeSlot() {
  const now = Date.now()
  const at = Math.max(now, pace.next)
  pace.next = at + MIN_GAP_MS
  if (at > now) await sleep(at - now)
}

/** fetch() with pacing and 429 back-off. Throws GarminError('rate-limit') if it never clears. */
async function pacedFetch(url: string, init: RequestInit, what: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    await takeSlot()
    let resp: Response
    try {
      resp = await fetch(url, { ...init, cache: 'no-store' })
    } catch (e) {
      throw new GarminError('network', `Could not reach Garmin (${what}): ${(e as Error).message}`)
    }
    if (resp.status !== 429) return resp
    let wait = 30
    try {
      const body = (await resp.json()) as { retryInSeconds?: number }
      if (typeof body.retryInSeconds === 'number') wait = body.retryInSeconds
    } catch {
      /* no usable body */
    }
    if (attempt >= MAX_429_RETRIES) {
      throw new GarminError('rate-limit', 'Garmin is rate-limiting requests. Try again in a few minutes.', 429)
    }
    // Hold every queued request back until the window reopens.
    pace.next = Math.max(pace.next, Date.now() + (Math.min(wait, 90) + 1) * 1000)
  }
}

export async function hasApiKey(): Promise<boolean> {
  try {
    await readApiKey()
    return true
  } catch {
    return false
  }
}

async function readApiKey(): Promise<string> {
  const env = process.env.GARMIN_PERSONAL_API_KEY?.trim()
  if (env) return env
  let key = ''
  try {
    key = (await readFile(API_KEY_FILE, 'utf8')).trim()
  } catch {
    /* fall through */
  }
  if (!key) {
    throw new GarminError('no-key', 'No Garmin API key found. Run `npm run garmin:key` to add one.')
  }
  return key
}

function preview(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > 300 ? `${t.slice(0, 300)}…` : t
}

async function fetchToken(): Promise<string> {
  const key = await readApiKey()
  const resp = await pacedFetch(
    GARMIN_BASE_URL + TOKEN_PATH,
    { method: 'POST', headers: { Authorization: `ApiKey ${key}`, Accept: '*/*' }, signal: AbortSignal.timeout(120_000) },
    'sign-in',
  )
  const body = (await resp.text()).trim()
  if (resp.status === 401 || resp.status === 403) {
    throw new GarminError(
      'auth',
      'Garmin rejected the API key. It may be mistyped, expired or revoked. Create a new key in Garmin Connect and run `npm run garmin:key`.',
      resp.status,
    )
  }
  if (!resp.ok) {
    throw new GarminError('http', `Token request failed: HTTP ${resp.status} ${preview(body)}`, resp.status)
  }
  if (!body) throw new GarminError('parse', 'Garmin returned an empty token response.')

  let token: string | undefined
  let ttl = DEFAULT_TOKEN_TTL_MS
  if (body.startsWith('{')) {
    // Garmin may answer with JSON...
    try {
      const json = JSON.parse(body) as Record<string, unknown>
      const t = json.access_token ?? json.accessToken ?? json.token
      if (typeof t === 'string' && t) token = t
      const exp = Number(json.expires_in ?? json.expiresIn)
      if (Number.isFinite(exp) && exp > 120) ttl = (exp - 60) * 1000
    } catch {
      throw new GarminError('parse', 'Garmin token response was not valid JSON.')
    }
  } else {
    // ...or with the bare token as plain text, possibly quoted.
    token = body.replace(/^"|"$/g, '')
  }
  if (!token) throw new GarminError('parse', 'Garmin token response contained no access token.')
  g.__garminToken = { token, expiresAt: Date.now() + ttl }
  return token
}

async function getToken(): Promise<string> {
  const cached = g.__garminToken
  if (cached && Date.now() < cached.expiresAt) return cached.token
  // Collapse concurrent callers onto one token request.
  g.__garminTokenPending ??= fetchToken().finally(() => {
    g.__garminTokenPending = undefined
  })
  return g.__garminTokenPending
}

export type Query = Record<string, string | number | undefined | null>

function buildUrl(path: string, query?: Query): string {
  if (!path.startsWith('/') || path.includes('://') || path.includes('..')) {
    throw new Error('path must be a relative API path starting with "/"')
  }
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && String(v) !== '') qs.set(k, String(v))
  }
  const s = qs.toString()
  return GARMIN_BASE_URL + path + (s ? `?${s}` : '')
}

async function send(url: string, accept: string): Promise<Response> {
  const token = await getToken()
  return pacedFetch(
    url,
    { method: 'GET', headers: { Authorization: `Bearer ${token}`, Accept: accept }, signal: AbortSignal.timeout(180_000) },
    new URL(url).pathname,
  )
}

/**
 * GET a JSON resource. Returns `null` when Garmin has no record (204, empty
 * body or 404), so callers can treat "no data that day" as a normal case.
 */
export async function garminGet<T = unknown>(path: string, query?: Query): Promise<T | null> {
  const url = buildUrl(path, query)
  let resp = await send(url, 'application/json')
  if (resp.status === 401) {
    // Token expired early or was invalidated: get a fresh one, retry once.
    g.__garminToken = undefined
    resp = await send(url, 'application/json')
    if (resp.status === 401) {
      throw new GarminError('auth', 'Garmin rejected the access token twice. Check the API key.', 401)
    }
  }
  if (resp.status === 406) resp = await send(url, '*/*')
  if (resp.status === 204 || resp.status === 404) return null
  const text = await resp.text()
  if (!resp.ok) {
    throw new GarminError('http', `GET ${path} -> HTTP ${resp.status}: ${preview(text)}`, resp.status)
  }
  if (!text.trim()) return null
  try {
    return JSON.parse(text) as T
  } catch {
    throw new GarminError('parse', `GET ${path} did not return JSON: ${preview(text)}`)
  }
}
