'use client'

import { useState } from 'react'
import { formatValue, type Fmt } from '@/lib/format'
import type { Source } from '../Kpi'
import { Tile } from './Tile'

export type PixelDay = { date: string; full: string; future?: boolean; v: Record<string, number | null> }
export type PixelMetric = { key: string; label: string; fmt: Fmt; source: Source; hint: string }

const CELL = 12
const GAP = 3
const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']

/** One square per day, a column per week. Colour is one hue, five steps by quintile. */
export function YearPixels({ weeks, months, metrics }: { weeks: PixelDay[][]; months: { col: number; label: string }[]; metrics: PixelMetric[] }) {
  const [key, setKey] = useState(metrics[0].key)
  const metric = metrics.find((m) => m.key === key)!
  const values = weeks.flat().map((d) => d.v[key]).filter((v): v is number => v !== null).sort((a, b) => a - b)
  const q = (p: number) => values[Math.min(values.length - 1, Math.floor(p * values.length))]
  const cuts = values.length ? [q(0.2), q(0.4), q(0.6), q(0.8)] : []
  const step = (v: number) => 1 + cuts.filter((c) => v > c).length
  const recorded = values.length
  const totalDays = weeks.flat().filter((d) => !d.future).length

  return (
    <Tile title="Year in pixels" subtitle="One square per day. Darker or brighter means more; empty means nothing recorded." source={metric.source}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Metric" className="inline-flex flex-wrap rounded-full border border-line p-0.5">
          {metrics.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setKey(m.key)}
              aria-pressed={m.key === key}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${m.key === key ? 'bg-ink text-page' : 'text-ink-2 hover:text-ink'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">{metric.hint}</span>
      </div>

      <div className="overflow-x-auto pb-1">
        <svg width={30 + weeks.length * (CELL + GAP)} height={18 + 7 * (CELL + GAP)} role="img" aria-label={`${metric.label} for each day of the last year`}>
          {months.map((m) => (
            <text key={m.col} x={30 + m.col * (CELL + GAP)} y={10} fontSize="10" fill="var(--muted)">{m.label}</text>
          ))}
          {DAYS.map((d, i) => (
            <text key={i} x={0} y={18 + i * (CELL + GAP) + 10} fontSize="10" fill="var(--muted)">{d}</text>
          ))}
          {weeks.map((week, w) =>
            week.map((d, i) => {
              if (d.future) return null
              const v = d.v[key]
              return (
                <rect
                  key={d.date}
                  x={30 + w * (CELL + GAP)}
                  y={18 + i * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  fill={v === null ? 'var(--wash)' : `var(--z${step(v)})`}
                >
                  <title>{`${d.full}: ${v === null ? 'nothing recorded' : formatValue(metric.fmt, v)}`}</title>
                </rect>
              )
            }),
          )}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>{recorded} of {totalDays} days have a value</span>
        {values.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            {formatValue(metric.fmt, values[0])}
            {[1, 2, 3, 4, 5].map((s) => <span key={s} className="h-3 w-3 rounded-[3px]" style={{ background: `var(--z${s})` }} />)}
            {formatValue(metric.fmt, values[values.length - 1])}
          </span>
        )}
      </div>
    </Tile>
  )
}
