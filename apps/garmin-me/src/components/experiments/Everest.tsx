'use client'

import { useState } from 'react'
import { fmtDay } from '@/lib/dates'
import { fmtInt } from '@/lib/format'
import { resolveSpan, SpanNote, SpanPills, type Span } from './span'
import { Big, Tile } from './Tile'

const EVEREST = 8849
const PEAKS = [
  { name: 'Ben Nevis', m: 1345 },
  { name: 'Mont Blanc', m: 4806 },
  { name: 'Kilimanjaro', m: 5895 },
  { name: 'Everest', m: EVEREST },
]

const W = 400
const H = 330
const BASE = 310
const TOP = 30
const y = (m: number) => BASE - (m / EVEREST) * (BASE - TOP)
// A rough massif: shoulder, summit, ridge.
const MOUNTAIN = `M70,${BASE} L130,220 L160,238 L215,110 L238,128 L268,${TOP} L300,118 L322,104 L372,${BASE} Z`

export function Everest({ daily: allDays, today }: { daily: { date: string; m: number }[]; today: string }) {
  const [span, setSpan] = useState<Span>('all')
  const loadedFrom = allDays[0]?.date ?? null
  const { from } = resolveSpan(span, today, loadedFrom)
  const daily = allDays.filter((d) => d.date >= from)
  const total = daily.reduce((a, d) => a + d.m, 0)
  const summits = Math.floor(total / EVEREST)
  const now = total - summits * EVEREST
  const days = daily.filter((d) => d.m > 0).length
  const perDay = days ? total / days : 0
  const toGo = EVEREST - now
  const best = daily.reduce((b, d) => (d.m > b.m ? d : b), { date: '', m: 0 })

  return (
    <Tile title="Climbing Everest" subtitle="Every stair and hill, stacked from sea level" source="estimate">
      <div className="mb-3 flex flex-col">
        <SpanPills span={span} onChange={setSpan} today={today} />
      </div>
      <SpanNote span={span} today={today} loadedFrom={loadedFrom} detail={`${days} with a climb recorded`} />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Mountain showing ${fmtInt(now)} of ${fmtInt(EVEREST)} metres climbed`}>
        <defs>
          <clipPath id="climbed">
            <rect x="0" y={y(now)} width={W} height={BASE - y(now) + 1} />
          </clipPath>
        </defs>
        <path d={MOUNTAIN} fill="var(--wash)" />
        <path d={MOUNTAIN} fill="var(--s1)" clipPath="url(#climbed)" />
        {PEAKS.map((p) => (
          <g key={p.name}>
            <line x1="0" x2={W} y1={y(p.m)} y2={y(p.m)} stroke="var(--grid)" strokeWidth="1" />
            {/* Drop the label below its line when your own marker sits just above it. */}
            <text x="0" y={now > p.m && now - p.m < 800 ? y(p.m) + 12 : y(p.m) - 4} fontSize="10.5" fill={now >= p.m || summits > 0 ? 'var(--ink-2)' : 'var(--muted)'}>
              {p.name} · {fmtInt(p.m)} m
            </text>
          </g>
        ))}
        <line x1="60" x2={W} y1={y(now)} y2={y(now)} stroke="var(--ink)" strokeWidth="1.5" />
        <text x={W} y={y(now) - 5} fontSize="11" fontWeight="600" textAnchor="end" fill="var(--ink)">
          You · {fmtInt(now)} m
        </text>
        <line x1="0" x2={W} y1={BASE} y2={BASE} stroke="var(--axis)" strokeWidth="1" />
      </svg>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Big
          value={fmtInt(now)}
          unit={`of ${fmtInt(EVEREST)} m`}
          caption={
            summits > 0
              ? `Summit reached ${summits === 1 ? 'once' : `${summits} times`} already (${fmtInt(total)} m in all). This is climb number ${summits + 1}.`
              : `${Math.round((now / EVEREST) * 100)}% of the way to the summit.`
          }
        />
        <ul className="self-end text-xs text-ink-2">
          <li className="flex justify-between border-t border-line py-1.5"><span>Average on days recorded</span><span className="tabular-nums text-ink">{fmtInt(perDay)} m</span></li>
          <li className="flex justify-between border-t border-line py-1.5"><span>Biggest day{best.date ? ` (${fmtDay(best.date)})` : ''}</span><span className="tabular-nums text-ink">{fmtInt(best.m)} m</span></li>
          <li className="flex justify-between border-t border-line py-1.5"><span>Summit at this rate</span><span className="tabular-nums text-ink">{perDay > 0 ? `about ${fmtInt(toGo / perDay)} days` : '–'}</span></li>
        </ul>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        From the watch&apos;s barometer (Garmin&apos;s &quot;floors climbed&quot;, in metres). The mountain shape is decorative; only
        the height scale is real.
      </p>
    </Tile>
  )
}
