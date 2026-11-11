import { hasApiKey } from '@/lib/garmin/client'
import { MAX_SYNC_DAYS } from '@/lib/garmin/sync'
import { loadData, type Dataset } from '@/lib/data'
import { addDays, diffDays, fmtDate, fmtDay, today } from '@/lib/dates'
import { makePeriod, parseRange, type Period } from '@/lib/metrics'
import { RangeSwitch, SyncControl, ThemeToggle } from './Controls'

export type PageProps = { searchParams: Promise<{ range?: string }> }
export type Ctx = { period: Period; data: Dataset }

/**
 * Page frame shared by every section: header with range switch, sync status
 * and theme toggle, plus the setup / first-sync / partial-history states.
 */
export async function Shell({
  title,
  searchParams,
  allTime,
  children,
}: {
  title: string
  searchParams: PageProps['searchParams']
  /** Page uses everything in the cache, so the range switch is hidden. */
  allTime?: boolean
  children: (ctx: Ctx) => React.ReactNode
}) {
  const hasKey = await hasApiKey()
  const data = loadData()
  const period = makePeriod(parseRange((await searchParams).range), today(), data.syncedFrom)
  const firstYear = +(data.syncedFrom ?? today()).slice(0, 4)
  const years = Array.from({ length: +today().slice(0, 4) - firstYear + 1 }, (_, i) => +today().slice(0, 4) - i)
  const empty = data.activities.length === 0 && data.days.size === 0

  const earliest = addDays(today(), -(MAX_SYNC_DAYS - 1))
  const wantFrom = allTime || period.prevStart < earliest ? earliest : period.prevStart
  const wantDays = diffDays(wantFrom, today()) + 1
  const partial = !empty && (!data.syncedFrom || data.syncedFrom > period.start)

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            {allTime
              ? 'Playful views of your data. Each tile says which dates it covers.'
              : `${fmtDate(period.start)} – ${fmtDate(period.end)} · ${period.title}`}
          </p>
        </div>
        <div className="flex flex-wrap items-start justify-end gap-3">
          {!allTime && <RangeSwitch range={period.range} years={years} />}
          <ThemeToggle />
          <SyncControl wantFrom={wantFrom} wantDays={wantDays} />
        </div>
      </header>

      {!hasKey ? (
        <Notice title="Connect your Garmin account">
          <p>No Garmin Personal API key has been saved yet. In a terminal, from this app&apos;s folder, run:</p>
          <pre className="my-3 overflow-x-auto rounded-lg bg-wash px-3 py-2 text-[13px] text-ink">npm run garmin:key</pre>
          <p>
            You&apos;ll be asked to paste the key (input is hidden). It is stored in a private file on this Mac, outside
            the project, and is only ever used by the local server. Then reload this page.
          </p>
        </Notice>
      ) : empty ? (
        <Notice title="Fetching your Garmin data">
          <p>
            The first sync is running now and usually takes under a minute. This page will fill in by itself when it
            finishes. If nothing happens, press the refresh button at the top right.
          </p>
        </Notice>
      ) : (
        <>
          {partial && !allTime && (
            <p className="mb-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-2">
              {period.start < earliest
                ? `Only history back to ${data.syncedFrom ? fmtDate(data.syncedFrom) : 'recently'} is loaded, so part of this range is empty. To load older years, run npm run garmin:backfill once.`
                : `Older history for this range is still being loaded${data.syncedFrom ? ` (cached back to ${fmtDay(data.syncedFrom)})` : ''}. Charts will fill in when the sync finishes.`}
            </p>
          )}
          {children({ period, data })}
        </>
      )}
    </div>
  )
}

export function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-line bg-surface p-6 text-sm leading-relaxed text-ink-2">
      <h2 className="mb-2 text-base font-semibold text-ink">{title}</h2>
      {children}
    </div>
  )
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-2">{title}</h2>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

export function Grid({ cols = 4, children }: { cols?: 2 | 3 | 4; children: React.ReactNode }) {
  const c = cols === 4 ? 'grid-cols-2 lg:grid-cols-4' : cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'
  return <div className={`grid gap-3 md:gap-4 ${c}`}>{children}</div>
}
