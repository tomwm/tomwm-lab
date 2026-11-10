/**
 * Discovery probe: call each Personal API endpoint once and report what comes
 * back, so the app only implements metrics Garmin really provides.
 *
 *   npm run garmin:probe            # shape summary only
 *   npm run garmin:probe -- --save  # also save raw JSON samples (outside the repo)
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DATA_DIR } from '../src/lib/garmin/config'
import { GarminError, garminGet, type Query } from '../src/lib/garmin/client'

const save = process.argv.includes('--save')
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return iso(d)
}
const yesterday = daysAgo(1)

/** Describe structure without dumping every value: keys, types, array sizes. */
function shape(v: unknown, depth = 0): unknown {
  if (v === null) return 'null'
  if (Array.isArray(v)) {
    if (v.length === 0) return '[] (empty)'
    return depth >= 3 ? `[${v.length} items]` : { [`[${v.length} items] first`]: shape(v[0], depth + 1) }
  }
  if (typeof v === 'object') {
    if (depth >= 3) return '{…}'
    return Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, shape(x, depth + 1)]))
  }
  if (typeof v === 'string') return v.length > 40 ? `string(${v.length})` : v
  return v
}

const probes: { name: string; path: string; query?: Query }[] = [
  { name: 'heart-rate-zones', path: '/biometric-service/heartRateZones/v2' },
  {
    name: 'activities-recent',
    path: '/activitylist-service/activities/search/activities',
    query: { start: 0, limit: 30 },
  },
  { name: 'hrv-14d', path: `/hrv-service/hrv/daily/${daysAgo(14)}/${yesterday}` },
  { name: 'sleep', path: '/sleep-service/sleep/dailySleep', query: { date: yesterday } },
  { name: 'daily-heart-rate', path: '/wellness-service/wellness/dailyHeartRate', query: { date: yesterday } },
  { name: 'daily-summary', path: '/usersummary-service/usersummary/daily', query: { calendarDate: yesterday } },
]

async function main() {
  const dir = join(DATA_DIR, 'samples')
  if (save) await mkdir(dir, { recursive: true, mode: 0o700 })
  let firstActivityId: unknown
  const typeCounts: Record<string, number> = {}

  const run = async (name: string, path: string, query?: Query) => {
    console.log(`\n=== ${name}  GET ${path} ${query ? JSON.stringify(query) : ''}`)
    try {
      const json = await garminGet(path, query)
      if (json === null) {
        console.log('(no record)')
        return null
      }
      console.log(JSON.stringify(shape(json), null, 1))
      if (save) await writeFile(join(dir, `${name}.json`), JSON.stringify(json, null, 2), { mode: 0o600 })
      return json
    } catch (e) {
      const ge = e as GarminError
      console.log(`ERROR [${ge.kind ?? 'unknown'}] ${ge.message}`)
      if (ge.kind === 'no-key' || ge.kind === 'auth') process.exit(1)
      return null
    }
  }

  for (const p of probes) {
    const json = await run(p.name, p.path, p.query)
    if (p.name === 'activities-recent' && json) {
      const list = Array.isArray(json)
        ? json
        : (Object.values(json as object).find(Array.isArray) as unknown[] | undefined) ?? []
      for (const a of list as Record<string, any>[]) {
        firstActivityId ??= a.activityId
        const t = a.activityType?.typeKey ?? 'unknown'
        typeCounts[t] = (typeCounts[t] ?? 0) + 1
      }
      console.log('activity types in last 30:', typeCounts)
      const strength = (list as Record<string, any>[]).find((a) =>
        String(a.activityType?.typeKey).includes('strength'),
      )
      if (strength) await run('activity-detail-strength', `/activity-service/activity/${strength.activityId}`)
    }
  }
  if (firstActivityId) await run('activity-detail-latest', `/activity-service/activity/${firstActivityId}`)
  if (save) console.log(`\nRaw samples saved in ${dir}`)
}

main()
