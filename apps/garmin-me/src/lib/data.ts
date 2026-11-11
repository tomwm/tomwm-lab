/** Server-side read model: normalised activities and days from the cache. */
import 'server-only'
import { allRaw, getMeta } from './garmin/db'
import {
  applyHrv, applySleep, applySummary, applyWeight, emptyDay, normalizeActivity, NORMALIZER_STAMP, type Activity, type Day,
} from './garmin/normalize'

export type Dataset = { activities: Activity[]; days: Map<string, Day>; syncedFrom: string | null }

const g = globalThis as unknown as { __garminData?: { version: string; data: Dataset } }

export function loadData(): Dataset {
  const version = `${getMeta('data_version') ?? '0'}:${NORMALIZER_STAMP}`
  if (g.__garminData?.version === version) return g.__garminData.data

  const activities = allRaw('activity')
    .map((r) => normalizeActivity(JSON.parse(r.json)))
    .filter((a): a is Activity => a !== null)
    .sort((a, b) => (a.startLocal < b.startLocal ? 1 : -1)) // newest first

  const days = new Map<string, Day>()
  const day = (date: string) => {
    let d = days.get(date)
    if (!d) days.set(date, (d = emptyDay(date)))
    return d
  }
  for (const r of allRaw('summary')) applySummary(day(r.key), JSON.parse(r.json))
  for (const r of allRaw('sleep')) applySleep(day(r.key), JSON.parse(r.json))
  for (const r of allRaw('hrv')) applyHrv(day(r.key), JSON.parse(r.json))
  for (const r of allRaw('weight')) applyWeight(day(r.key), JSON.parse(r.json))

  const data = { activities, days, syncedFrom: getMeta('synced_from') }
  g.__garminData = { version, data }
  return data
}
