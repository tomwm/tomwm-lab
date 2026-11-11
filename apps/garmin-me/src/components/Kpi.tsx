import type { Delta } from '@/lib/metrics'

export type Source = 'garmin' | 'estimate'

export const SOURCE_TEXT: Record<Source, string> = {
  garmin: "Garmin's own data, including simple totals and averages of it",
  estimate: "Estimated by this app from Garmin data. Garmin doesn't report this figure, so treat it as a guide",
}

/** A small dot saying where a figure comes from: grey for Garmin, amber for an estimate. */
export function SourceTag({ source }: { source: Source }) {
  return (
    <span className="group relative inline-flex h-4 w-4 shrink-0 cursor-help items-center justify-center" title={SOURCE_TEXT[source]}>
      <span
        className="h-[7px] w-[7px] rounded-full"
        style={source === 'garmin' ? { background: 'var(--muted)' } : { background: 'var(--s4)' }}
        role="img"
        aria-label={source === 'garmin' ? 'Garmin data' : 'Estimate'}
      />
    </span>
  )
}

/** Tiny trend line. Gaps in the data are left as gaps. */
function Sparkline({ values, color }: { values: (number | null)[]; color: string }) {
  const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null)
  if (pts.length < 2 || values.length < 2) return <div className="h-8" />
  const lo = Math.min(...pts.map((p) => p.v))
  const hi = Math.max(...pts.map((p) => p.v))
  const x = (i: number) => (i / (values.length - 1)) * 100
  const y = (v: number) => (hi === lo ? 16 : 29 - ((v - lo) / (hi - lo)) * 26)
  // Break the path wherever a value is missing.
  let d = ''
  let pen = false
  const lone: { v: number; i: number }[] = []
  values.forEach((v, i) => {
    if (v === null) {
      pen = false
      return
    }
    if (!pen && (values[i + 1] ?? null) === null) lone.push({ v, i })
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(2)},${y(v).toFixed(2)} `
    pen = true
  })
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {lone.map((p) => (
        <path key={p.i} d={`M${x(p.i).toFixed(2)},${y(p.v).toFixed(2)} l0.01,0`} stroke={color} strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}

export function Kpi({
  label,
  value,
  unit,
  sub,
  delta,
  spark,
  color = 'var(--s1)',
  source,
}: {
  label: string
  /** Pre-formatted number, or null when there is no data. */
  value: string | null
  unit?: string
  sub?: string
  delta?: Delta | null
  spark?: (number | null)[]
  color?: string
  source: Source
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm text-ink-2">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
          <span className="leading-tight">{label}</span>
        </span>
        <SourceTag source={source} />
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={`text-[28px] font-semibold leading-none tracking-tight md:text-[32px] ${value === null ? 'text-muted' : ''}`}>
          {value ?? '–'}
        </span>
        {unit && value !== null && <span className="text-sm text-muted">{unit}</span>}
      </div>
      <div className="mt-2 min-h-[2.25rem] text-xs leading-snug">
        {sub && <div className="text-ink-2">{sub}</div>}
        {delta && (
          <div className={delta.tone === 'good' ? 'text-good' : delta.tone === 'bad' ? 'text-bad' : 'text-muted'}>
            {delta.dir === 'up' ? '▲ ' : delta.dir === 'down' ? '▼ ' : ''}
            {delta.text}
          </div>
        )}
        {value === null && !sub && <div className="text-muted">No data in this range</div>}
      </div>
      {spark && <div className="mt-auto pt-2"><Sparkline values={spark} color={color} /></div>}
    </div>
  )
}
