'use client'

import { addDays, diffDays, fmtDate } from '@/lib/dates'
import { fmtInt } from '@/lib/format'

/** Which dates an experiment tile counts. */
export type Span = 'all' | 'year' | '12m'

export function Pills<T extends string>({ label, options, value, onChange }: { label: string; options: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap self-start rounded-full border border-line p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={o.key === value}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${o.key === value ? 'bg-ink text-page' : 'text-ink-2 hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SpanPills({ span, onChange, today }: { span: Span; onChange: (s: Span) => void; today: string }) {
  return (
    <Pills
      label="Dates counted"
      options={[
        { key: 'all' as Span, label: 'All loaded' },
        { key: 'year' as Span, label: `${today.slice(0, 4)} only` },
        { key: '12m' as Span, label: 'Last 12 months' },
      ]}
      value={span}
      onChange={onChange}
    />
  )
}

/** Resolve a span to real dates, clipped to what has been loaded from Garmin. */
export function resolveSpan(span: Span, today: string, loadedFrom: string | null) {
  const wanted = span === 'year' ? `${today.slice(0, 4)}-01-01` : span === '12m' ? addDays(today, -364) : (loadedFrom ?? today)
  const from = loadedFrom && loadedFrom > wanted ? loadedFrom : wanted
  return { from, wanted, days: diffDays(from, today) + 1, clipped: !!loadedFrom && loadedFrom > wanted }
}

/** The plain statement of exactly which dates a tile is counting. */
export function SpanNote({ span, today, loadedFrom, detail }: { span: Span; today: string; loadedFrom: string | null; detail: string }) {
  const r = resolveSpan(span, today, loadedFrom)
  return (
    <p className="mb-5 rounded-xl bg-wash px-3 py-2 text-xs leading-relaxed text-ink-2">
      <strong className="font-semibold text-ink">
        Counting {fmtDate(r.from)} to {fmtDate(today)}
      </strong>{' '}
      ({fmtInt(r.days)} days, {detail}).
      {span === 'all' &&
        (r.days <= 401
          ? ' This is everything loaded from Garmin so far, which is about the last 400 days and not your whole Garmin history. To load the rest, run npm run garmin:backfill once.'
          : ' This is all the Garmin history loaded into the app.')}
      {span !== 'all' && r.clipped && loadedFrom && ` History is only loaded back to ${fmtDate(loadedFrom)}, so earlier days in this window are missing.`}
    </p>
  )
}
