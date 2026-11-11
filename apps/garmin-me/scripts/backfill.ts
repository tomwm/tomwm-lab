/**
 * One-off: load older Garmin history into the local cache.
 *
 *   npm run garmin:backfill                 # back to your first recorded activity
 *   npm run garmin:backfill -- 2019-01-01   # back to a date you choose
 *   npm run garmin:backfill -- --dry        # only report how far back and how long
 *
 * The app itself only loads about the last 400 days. This goes further. It is
 * slow because Garmin allows ~100 requests a minute and sleep + daily summary
 * cost one request per day each (roughly ten minutes per year of history).
 * It is safe to stop with Ctrl-C and run again: days already saved are skipped.
 * The app can stay open while it runs.
 */
import { GarminError, garminGet } from '../src/lib/garmin/client'
import { fetchedAt, getMeta, setMeta } from '../src/lib/garmin/db'
import { syncFrom, syncProgress } from '../src/lib/garmin/sync'
import { diffDays, eachDay, today } from '../src/lib/dates'

const args = process.argv.slice(2)
const dry = args.includes('--dry')
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a))
const bad = args.find((a) => a !== '--dry' && a !== dateArg)

async function oldestActivityDate(): Promise<string | null> {
  let oldest: string | null = null
  for (let offset = 0; offset < 20_000; offset += 200) {
    const page = await garminGet<unknown>('/activitylist-service/activities/search/activities', { start: offset, limit: 200 })
    const list = Array.isArray(page) ? (page as { startTimeLocal?: string }[]) : []
    for (const a of list) {
      const d = a.startTimeLocal?.slice(0, 10)
      if (d && (!oldest || d < oldest)) oldest = d
    }
    process.stdout.write(`\rLooking for your first activity… ${offset + list.length} activities checked`)
    if (list.length < 200) break
  }
  process.stdout.write('\n')
  return oldest
}

const mins = (requests: number) => Math.max(1, Math.round((requests * 0.72) / 60))

async function main() {
  if (bad) throw new Error(`Didn't understand "${bad}". Use a date like 2019-01-01, or --dry.`)
  const start = dateArg ?? (await oldestActivityDate())
  if (!start) throw new Error('No activities found, so there is no obvious start date. Pass one, e.g. 2019-01-01.')
  if (start > today()) throw new Error('The start date is in the future.')

  const days = eachDay(start, today())
  const need = (['summary', 'sleep'] as const).reduce((n, kind) => {
    const have = fetchedAt(kind)
    return n + days.filter((d) => !have.has(d)).length
  }, 0)
  console.log(`${dateArg ? 'Start date' : 'First recorded activity'}: ${start} (${days.length} days, ${(diffDays(start, today()) / 365).toFixed(1)} years).`)
  console.log(`Currently loaded back to: ${getMeta('synced_from') ?? 'nothing yet'}.`)
  console.log(`About ${need} requests still needed, roughly ${mins(need)} minutes.`)
  if (dry) return
  if (need === 0) console.log('Days are all cached; refreshing activities and HRV only.')

  const timer = setInterval(() => {
    const p = syncProgress()
    const pct = p.total ? ` ${Math.round((p.done / p.total) * 100)}% (${p.done}/${p.total}), about ${mins(p.total - p.done)} min left` : ''
    process.stdout.write(`\r${p.phase || 'starting'}${pct}        `)
  }, 2000)
  try {
    await syncFrom(start)
  } finally {
    clearInterval(timer)
    // Tell the running app its cache changed, even if we stopped part-way.
    setMeta('data_version', String(Date.now()))
  }
  setMeta('last_sync_at', String(Date.now()))
  const p = syncProgress()
  console.log(`\nDone. History is loaded back to ${getMeta('synced_from')}.${p.failed ? ` ${p.failed} requests failed; run again to retry them.` : ''}`)
}

main().catch((e) => {
  console.error(`\n${e instanceof GarminError ? e.message : (e as Error).message}`)
  console.error('Anything fetched so far is saved. Run the command again to carry on.')
  process.exit(1)
})
