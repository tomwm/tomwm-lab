import { fmtHours } from '@/lib/format'
import { SourceTag } from './Kpi'

const NAMES = ['Zone 1 · Warm-up', 'Zone 2 · Easy', 'Zone 3 · Aerobic', 'Zone 4 · Threshold', 'Zone 5 · Maximum']

/** Time in heart-rate zones as one segmented bar (one hue, light to dark). */
export function ZoneBar({ title, subtitle, zonesSec }: { title: string; subtitle?: string; zonesSec: number[] }) {
  const total = zonesSec.reduce((a, b) => a + b, 0)
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        <SourceTag source="garmin" />
      </div>
      {total === 0 ? (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">
          No heart-rate zone data in this range
        </div>
      ) : (
        <>
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={zonesSec.map((s, i) => `${NAMES[i]}: ${fmtHours(s / 3600)}`).join(', ')}>
            {zonesSec.map((s, i) => (s > 0 ? <div key={i} style={{ width: `${(s / total) * 100}%`, background: `var(--z${i + 1})` }} /> : null))}
          </div>
          <ul className="mt-4 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
            {zonesSec.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-ink-2">
                <span className="h-2 w-2 rounded-sm" style={{ background: `var(--z${i + 1})` }} />
                {NAMES[i]}
                <span className="ml-auto tabular-nums text-ink">{fmtHours(s / 3600)}</span>
                <span className="w-9 text-right tabular-nums text-muted">{Math.round((s / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
