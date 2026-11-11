'use client'

import { useState } from 'react'
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { fmtOne, fmtPace } from '@/lib/format'
import { resolveSpan, SpanNote, SpanPills, type Span } from './span'
import { Tile } from './Tile'

export type RunDot = { date: string; name: string; when: string; hr: number; pace: number; km: number }

function Tip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload as RunDot
  return (
    <div className="rounded-xl border border-line bg-raised px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-ink">{r.name}</div>
      <div className="mb-1 text-muted">{r.when}</div>
      <div className="text-ink-2">{fmtPace(r.pace)} /km at {Math.round(r.hr)} bpm · {fmtOne(r.km)} km</div>
    </div>
  )
}

const round = (v: number, step: number, up: boolean) => (up ? Math.ceil(v / step) : Math.floor(v / step)) * step

/** Each run as a dot. Up and to the left is fitter: faster for less effort. */
export function PaceHeart({ runs: allRuns, today, loadedFrom }: { runs: RunDot[]; today: string; loadedFrom: string | null }) {
  const [span, setSpan] = useState<Span>('all')
  const { from } = resolveSpan(span, today, loadedFrom)
  const runs = allRuns.filter((r) => r.date >= from)
  const hr = runs.map((r) => r.hr)
  const pace = runs.map((r) => r.pace)
  return (
    <Tile title="Pace against heart rate" subtitle="One dot per run, sized by distance. Up and to the left is fitter: faster for less effort." source="estimate">
      <div className="mb-3 flex flex-col">
        <SpanPills span={span} onChange={setSpan} today={today} />
      </div>
      <SpanNote span={span} today={today} loadedFrom={loadedFrom} detail={`${runs.length} run${runs.length === 1 ? '' : 's'} with heart-rate data`} />
      {runs.length < 2 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">
          Fewer than two runs with heart-rate data in these dates
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 12, bottom: 18, left: 4 }}>
              <CartesianGrid stroke="var(--grid)" />
              <XAxis
                type="number"
                dataKey="hr"
                domain={[round(Math.min(...hr) - 3, 10, false), round(Math.max(...hr) + 3, 10, true)]}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--axis)' }}
                label={{ value: 'Average heart rate (bpm)', position: 'insideBottom', offset: -10, fill: 'var(--muted)', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="pace"
                reversed
                width={44}
                domain={[round(Math.min(...pace) - 10, 30, false), round(Math.max(...pace) + 10, 30, true)]}
                tickFormatter={(v: number) => fmtPace(v)}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <ZAxis type="number" dataKey="km" range={[70, 420]} />
              <Tooltip content={<Tip />} cursor={{ stroke: 'var(--axis)' }} isAnimationActive={false} />
              <Scatter data={runs} fill="var(--s1)" fillOpacity={0.85} stroke="var(--surface)" strokeWidth={2} isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {runs.length < 20 ? 'This is too few runs to read a trend into. ' : ''}Hills, heat and
        tiredness all move a dot, so treat this as a picture, not a fitness score. Y axis is minutes per km, faster at
        the top.
      </p>
    </Tile>
  )
}
