/**
 * Pulls data from Garmin into the local cache.
 *
 * - Activities: one paged list call covers the whole window.
 * - HRV: range endpoint, fetched in 28-day chunks.
 * - Weight: one range request for the whole history.
 * - Daily summary + sleep: one call per day each (paced by the client to stay
 *   under Garmin's ~100 requests/minute, so a full 400-day backfill takes
 *   around ten minutes, once). A day is fetched once and
 *   then kept forever, unless it was fetched before it had finished (the last
 *   couple of days are always refreshed).
 *
 * Runs as a single background job in the Next.js server process; the UI polls
 * getSyncStatus() for progress.
 */
import { GarminError, garminGet, hasApiKey, type GarminErrorKind } from './client'
import { fetchedAt, getMeta, putRaw, setMeta } from './db'
import { addDays, eachDay, parseISO, today } from '../dates'

export const MAX_SYNC_DAYS = 400
const HRV_CHUNK_DAYS = 28
const CONCURRENCY = 3
/** A day's data is treated as final once fetched this long after the day ended. */
const SETTLE_MS = 36 * 3600 * 1000

export type SyncStatus = {
  hasKey: boolean
  running: boolean
  phase: string
  done: number
  total: number
  /** Last time a sync finished successfully (ms). */
  lastSyncAt: number | null
  /** Earliest date any sync has covered. */
  syncedFrom: string | null
  error: { kind: GarminErrorKind | 'unknown'; message: string; at: number } | null
  /** Days that failed in the last run (skipped, will retry next time). */
  failedDays: number
}

type State = Omit<SyncStatus, 'hasKey' | 'lastSyncAt' | 'syncedFrom'>
const g = globalThis as unknown as { __garminSync?: State }
const state = (g.__garminSync ??= { running: false, phase: '', done: 0, total: 0, error: null, failedDays: 0 })

/** Live progress of the sync running in this process. */
export const syncProgress = () => ({ phase: state.phase, done: state.done, total: state.total, failed: state.failedDays })

export async function getSyncStatus(): Promise<SyncStatus> {
  const last = getMeta('last_sync_at')
  return { ...state, hasKey: await hasApiKey(), lastSyncAt: last ? Number(last) : null, syncedFrom: getMeta('synced_from') }
}

/** Kick off a sync covering the last `days` days. No-op if one is running. */
export function startSync(days: number) {
  if (state.running) return
  const n = Math.max(3, Math.min(MAX_SYNC_DAYS, Math.round(days) || 30))
  Object.assign(state, { running: true, phase: 'activities', done: 0, total: 0, error: null, failedDays: 0 })
  syncFrom(addDays(today(), -(n - 1)))
    .then(() => {
      setMeta('last_sync_at', String(Date.now()))
      setMeta('data_version', String(Date.now()))
    })
    .catch((e) => {
      const kind = e instanceof GarminError ? e.kind : 'unknown'
      state.error = { kind, message: (e as Error).message, at: Date.now() }
      setMeta('data_version', String(Date.now())) // keep whatever was fetched
    })
    .finally(() => {
      state.running = false
      state.phase = ''
    })
}

const isFatal = (e: unknown) =>
  e instanceof GarminError && (e.kind === 'auth' || e.kind === 'no-key' || e.kind === 'rate-limit' || e.kind === 'network')

/**
 * Fetch everything from `start` to today into the cache, skipping days that
 * are already final. Used by the app's sync and by scripts/backfill.ts.
 */
export async function syncFrom(start: string) {
  const end = today()

  // 1. Activities
  state.phase = 'activities'
  for (let offset = 0; offset < 5000; offset += 200) {
    const page = await garminGet<unknown>('/activitylist-service/activities/search/activities', {
      start: offset,
      limit: 200,
      startDate: start,
    })
    const list = Array.isArray(page) ? (page as Record<string, unknown>[]) : []
    for (const a of list) if (a?.activityId != null) putRaw('activity', String(a.activityId), a)
    if (list.length < 200) break
  }

  // 2. HRV, in chunks (the range endpoint rejects long spans)
  state.phase = 'HRV'
  for (let from = start; from <= end; from = addDays(from, HRV_CHUNK_DAYS)) {
    const to = addDays(from, HRV_CHUNK_DAYS - 1) < end ? addDays(from, HRV_CHUNK_DAYS - 1) : end
    try {
      const res = await garminGet<{ hrvSummaries?: Record<string, unknown>[] }>(`/hrv-service/hrv/daily/${from}/${to}`)
      for (const h of res?.hrvSummaries ?? []) {
        if (typeof h.calendarDate === 'string') putRaw('hrv', h.calendarDate, h)
      }
    } catch (e) {
      if (isFatal(e)) throw e
      state.failedDays += 1
    }
  }

  // Weight: one request covers any span, so always ask for everything we hold.
  state.phase = 'weight'
  try {
    const known = getMeta('synced_from')
    const from = known && known < start ? known : start
    const res = await garminGet<{ dailyWeightSummaries?: Record<string, unknown>[] }>(
      `/weight-service/weight/range/${from}/${end}`,
      { includeAll: 'true' },
    )
    for (const w of res?.dailyWeightSummaries ?? []) {
      // Keep the day's latest reading and its range; drop the per-reading list.
      const { allWeightMetrics: _all, ...day } = w
      if (typeof day.summaryDate === 'string') putRaw('weight', day.summaryDate, day)
    }
  } catch (e) {
    if (isFatal(e)) throw e
    state.failedDays += 1
  }

  // 3. Per-day summary and sleep, skipping days already final in the cache
  const now = Date.now()
  const jobs: { kind: 'summary' | 'sleep'; date: string }[] = []
  for (const kind of ['summary', 'sleep'] as const) {
    const have = fetchedAt(kind)
    for (const date of eachDay(start, end)) {
      const at = have.get(date)
      const dayEnd = parseISO(addDays(date, 1)).getTime()
      if (at === undefined || at < dayEnd + SETTLE_MS || now < dayEnd) jobs.push({ kind, date })
    }
  }
  // Newest first, so recent data appears even if a long backfill is interrupted.
  jobs.sort((a, b) => (a.date < b.date ? 1 : -1))
  state.phase = 'daily health & sleep'
  state.total = jobs.length
  state.done = 0

  let next = 0
  let fatal: unknown = null
  const worker = async () => {
    while (next < jobs.length && !fatal) {
      const job = jobs[next++]
      try {
        const json =
          job.kind === 'summary'
            ? await garminGet('/usersummary-service/usersummary/daily', { calendarDate: job.date })
            : await garminGet('/sleep-service/sleep/dailySleep', { date: job.date })
        putRaw(job.kind, job.date, json)
      } catch (e) {
        if (isFatal(e)) fatal = e
        else state.failedDays += 1
      }
      state.done += 1
      // Let the UI show progress during a long backfill.
      if (state.done % 40 === 0) setMeta('data_version', String(Date.now()))
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  if (fatal) throw fatal

  const prev = getMeta('synced_from')
  if (!prev || start < prev) setMeta('synced_from', start)
}
