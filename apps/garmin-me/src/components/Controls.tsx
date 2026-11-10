'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { RANGES, type RangeKey } from '@/lib/metrics'
import type { SyncStatus } from '@/lib/garmin/sync'

export function RangeSwitch({ range }: { range: RangeKey }) {
  const pathname = usePathname()
  return (
    <div role="group" aria-label="Time range" className="inline-flex rounded-full border border-line bg-surface p-0.5">
      {RANGES.map((r) => (
        <Link
          key={r.key}
          href={`${pathname}?range=${r.key}`}
          scroll={false}
          aria-current={r.key === range ? 'true' : undefined}
          title={`Last ${r.label}`}
          className={`rounded-full px-3 py-1.5 text-xs font-medium tabular-nums transition-colors ${
            r.key === range ? 'bg-ink text-page' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {r.short}
        </Link>
      ))}
    </div>
  )
}

type Theme = 'auto' | 'light' | 'dark'
const NEXT: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' }

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('auto')
  useEffect(() => {
    const t = document.documentElement.dataset.theme
    setTheme(t === 'light' || t === 'dark' ? t : 'auto')
  }, [])
  const cycle = () => {
    const t = NEXT[theme]
    setTheme(t)
    if (t === 'auto') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = t
    try {
      if (t === 'auto') localStorage.removeItem('theme')
      else localStorage.setItem('theme', t)
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${theme}. Click to change.`}
      aria-label={`Theme: ${theme}. Click to change.`}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-medium capitalize text-ink-2 hover:text-ink"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        {theme === 'dark' ? (
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.500z" />
        ) : theme === 'light' ? (
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.400 1.400M17 17l1.400 1.400M5.600 18.400 7 17M17 7l1.400-1.400M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
        ) : (
          <path d="M12 3a9 9 0 1 0 0 18zM12 3a9 9 0 0 1 0 18" />
        )}
      </svg>
      {theme}
    </button>
  )
}

function ago(ms: number): string {
  const min = Math.round((Date.now() - ms) / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.round(min / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

const STALE_MS = 60 * 60 * 1000
const ERROR_BACKOFF_MS = 10 * 60 * 1000

/**
 * Shows when data was last fetched, a manual refresh button, live progress and
 * errors. Syncs automatically when the cache is over an hour old or doesn't
 * yet reach back far enough for the selected range (already-cached days are
 * skipped, so this is cheap).
 */
export function SyncControl({ wantFrom, wantDays }: { wantFrom: string; wantDays: number }) {
  const router = useRouter()
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const wasRunning = useRef(false)
  const autoTried = useRef<string | null>(null)
  const polls = useRef(0)

  const start = useCallback(async () => {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ days: wantDays }),
    })
    setStatus(await res.json())
  }, [wantDays])

  // Poll fast while a sync is running, slowly otherwise.
  const running = status?.running ?? false
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const s: SyncStatus = await (await fetch('/api/sync', { cache: 'no-store' })).json()
        if (!alive) return
        // Refresh the page when a sync ends, and every ~15s during a long one.
        polls.current += 1
        if ((wasRunning.current && !s.running) || (s.running && polls.current % 15 === 0)) router.refresh()
        wasRunning.current = s.running
        setStatus(s)
      } catch {
        /* server restarting; try again on the next tick */
      }
    }
    tick()
    const timer = setInterval(tick, running ? 1000 : 60_000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [router, running])

  // Auto-sync, at most once per range per page visit.
  useEffect(() => {
    if (!status || status.running || !status.hasKey || autoTried.current === wantFrom) return
    const stale = !status.lastSyncAt || Date.now() - status.lastSyncAt > STALE_MS
    const shallow = !status.syncedFrom || status.syncedFrom > wantFrom
    const recentError = status.error && Date.now() - status.error.at < ERROR_BACKOFF_MS
    if ((stale || shallow) && !recentError) {
      autoTried.current = wantFrom
      wasRunning.current = true
      start()
    }
  }, [status, wantFrom, start])

  if (!status) return <span className="text-xs text-muted">Checking…</span>
  if (!status.hasKey) return null

  const pct = status.total ? Math.round((status.done / status.total) * 100) : null
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted" aria-live="polite">
          {status.running
            ? `Syncing ${status.phase}${pct !== null ? ` · ${pct}%` : '…'}`
            : status.lastSyncAt
              ? `Synced ${ago(status.lastSyncAt)}`
              : 'Not synced yet'}
        </span>
        <button
          type="button"
          onClick={() => {
            wasRunning.current = true
            start()
          }}
          disabled={status.running}
          title="Refresh from Garmin"
          aria-label="Refresh from Garmin"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink-2 hover:text-ink disabled:opacity-60"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={status.running ? 'animate-spin' : ''} aria-hidden>
            <path d="M20 11a8 8 0 1 0-2.300 5.700M20 4v7h-7" />
          </svg>
        </button>
      </div>
      {status.running && pct !== null && (
        <div className="h-1 w-40 overflow-hidden rounded-full bg-wash" aria-hidden>
          <div className="h-full rounded-full bg-ink-2 transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      )}
      {!status.running && status.error && (
        <p role="alert" className="max-w-xs text-right text-xs text-bad">
          ⚠ {status.error.message} Showing cached data.
        </p>
      )}
      {!status.running && !status.error && status.failedDays > 0 && (
        <p className="max-w-xs text-right text-xs text-muted">
          {status.failedDays} request{status.failedDays === 1 ? '' : 's'} failed and will be retried on the next refresh.
        </p>
      )}
    </div>
  )
}
