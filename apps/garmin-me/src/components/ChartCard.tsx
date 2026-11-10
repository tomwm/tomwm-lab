'use client'

import { useState } from 'react'
import {
  Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { formatTick, formatValue, type Fmt } from '@/lib/format'
import { SourceTag, type Source } from './Kpi'

export type Series = { key: string; name: string; color: string }
export type ChartRow = { label: string; full?: string; [k: string]: string | number | null | undefined }

type Props = {
  title: string
  subtitle?: string
  source: Source
  data: ChartRow[]
  series: Series[]
  kind: 'line' | 'bar'
  fmt: Fmt
  stacked?: boolean
  /** Flip the y axis (pace: lower is faster, so faster sits higher). */
  reversed?: boolean
  /** Shaded reference range, e.g. Garmin's HRV baseline. */
  band?: { low: number; high: number; label: string }
  refLine?: { y: number; label: string }
  height?: number
}

function TooltipBox({ active, payload, series, fmt }: { active?: boolean; payload?: any[]; series: Series[]; fmt: Fmt }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload as ChartRow
  const shown = series.filter((s) => typeof row[s.key] === 'number' && (series.length === 1 || (row[s.key] as number) > 0))
  return (
    <div className="rounded-xl border border-line bg-raised px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium text-ink">{row.full ?? row.label}</div>
      {shown.length === 0 && <div className="text-muted">No data</div>}
      {shown.map((s) => (
        <div key={s.key} className="flex items-center gap-2 text-ink-2">
          <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
          <span>{s.name}</span>
          <span className="ml-auto pl-4 font-medium tabular-nums text-ink">{formatValue(fmt, row[s.key] as number)}</span>
        </div>
      ))}
    </div>
  )
}

export function ChartCard({ title, subtitle, source, data, series, kind, fmt, stacked, reversed, band, refLine, height = 220 }: Props) {
  const [table, setTable] = useState(false)
  const all = data.flatMap((r) => series.map((s) => r[s.key])).filter((v): v is number => typeof v === 'number')
  const hasData = kind === 'bar' ? all.some((v) => v > 0) : all.length > 0
  // Only list series that appear, but never recolour them.
  const present = series.filter((s) => data.some((r) => typeof r[s.key] === 'number' && (kind === 'line' || (r[s.key] as number) > 0)))
  const sparse = data.length <= 45

  // Line charts don't start at zero, so pick a tidy range and round ticks ourselves.
  let domain: [number, number] | [number, 'auto'] = [0, 'auto']
  let ticks: number[] | undefined
  if (kind === 'line' && all.length) {
    const lo = Math.min(...all, band?.low ?? Infinity)
    const hi = Math.max(...all, band?.high ?? -Infinity)
    const span = Math.max(hi - lo, 1)
    const steps = fmt === 'pace' ? [5, 10, 15, 30, 60, 120, 300] : [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000, 2000, 5000]
    const step = steps.find((x) => span / x <= 4) ?? steps[steps.length - 1]
    let a = Math.max(0, Math.floor((lo - span * 0.05) / step) * step)
    let b = Math.ceil((hi + span * 0.05) / step) * step
    if (fmt === 'score') b = Math.min(b, 100)
    if (a === b) b = a + step
    domain = [a, b]
    ticks = []
    for (let t = a; t <= b + 1e-9; t += step) ticks.push(t)
  }

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-4 md:p-5">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SourceTag source={source} />
          {hasData && (
            <button
              type="button"
              onClick={() => setTable((t) => !t)}
              aria-pressed={table}
              className="rounded-full border border-line px-2 py-px text-[10px] font-medium uppercase tracking-wide text-muted hover:text-ink"
            >
              {table ? 'Chart' : 'Table'}
            </button>
          )}
        </div>
      </div>

      {present.length > 1 && (
        <div className="mb-1 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
          {present.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className={kind === 'line' ? 'h-0.5 w-3 rounded' : 'h-2 w-2 rounded-sm'} style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
          {band && <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-wash" />{band.label}</span>}
        </div>
      )}
      {present.length <= 1 && band && hasData && (
        <div className="mb-1 mt-2 flex gap-4 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm" style={{ background: 'var(--wash)' }} />{band.label}</span>
        </div>
      )}

      <div className="mt-3" style={{ height }}>
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">
            No data in this range
          </div>
        ) : table ? (
          <div className="h-full overflow-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="sticky top-0 bg-surface text-muted">
                <tr>
                  <th className="py-1.5 pr-3 font-medium">Period</th>
                  {present.map((s) => <th key={s.key} className="py-1.5 pr-3 text-right font-medium">{s.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="py-1.5 pr-3 text-ink-2">{r.full ?? r.label}</td>
                    {present.map((s) => (
                      <td key={s.key} className="py-1.5 pr-3 text-right text-ink">
                        {typeof r[s.key] === 'number' ? formatValue(fmt, r[s.key] as number) : '–'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--axis)' }}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis
                width={40}
                domain={domain}
                ticks={ticks}
                reversed={reversed}
                allowDecimals={fmt === 'hours'}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatTick(fmt, v)}
              />
              <Tooltip
                content={<TooltipBox series={series} fmt={fmt} />}
                cursor={kind === 'bar' ? { fill: 'var(--wash)' } : { stroke: 'var(--axis)', strokeWidth: 1 }}
                isAnimationActive={false}
              />
              {band && <ReferenceArea y1={band.low} y2={band.high} fill="var(--ink)" fillOpacity={0.06} stroke="none" ifOverflow="extendDomain" />}
              {refLine && (
                <ReferenceLine
                  y={refLine.y}
                  stroke="var(--muted)"
                  strokeWidth={1}
                  ifOverflow="extendDomain"
                  label={{ value: refLine.label, position: 'insideTopRight', fill: 'var(--muted)', fontSize: 11 }}
                />
              )}
              {kind === 'bar' &&
                present.map((s, i) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.name}
                    stackId={stacked ? 'a' : undefined}
                    fill={s.color}
                    maxBarSize={24}
                    radius={!stacked || i === present.length - 1 ? [4, 4, 0, 0] : 0}
                    stroke="var(--surface)"
                    strokeWidth={stacked ? 1 : 0}
                    isAnimationActive={false}
                  />
                ))}
              {kind === 'line' &&
                present.map((s) => (
                  <Line
                    key={s.key}
                    dataKey={s.key}
                    name={s.name}
                    type="linear"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    connectNulls={false}
                    isAnimationActive={false}
                    activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
                    dot={(p: any) => {
                      const { cx, cy, index } = p
                      const v = data[index]?.[s.key]
                      const lone = typeof data[index - 1]?.[s.key] !== 'number' && typeof data[index + 1]?.[s.key] !== 'number'
                      if (typeof v !== 'number' || cy == null || (!sparse && !lone)) return <g key={index} />
                      return <circle key={index} cx={cx} cy={cy} r={sparse && data.length <= 31 ? 4 : 3} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
                    }}
                  />
                ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
