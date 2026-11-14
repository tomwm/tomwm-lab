'use client'

import { useState } from 'react'
import { MUSCLE_LABEL, MUSCLES, type Muscle } from '@/lib/muscles'
import { SourceTag } from './Kpi'

/**
 * Front and back body outlines with each muscle group shaded by weighted
 * sets, beside a ranked list with the exact numbers. Hovering either side
 * highlights the same muscle in both.
 */

const fmtSets = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))

// Shapes are drawn on a 200 x 430 figure; right-side shapes mirror the left.
type Shape = { muscle: Muscle; d?: string; ellipse?: [number, number, number, number]; rect?: [number, number, number, number, number] }

const FRONT: Shape[] = [
  { muscle: 'shoulders', ellipse: [64, 84, 15, 15] },
  { muscle: 'chest', d: 'M99 74 H77 Q66 76 66 90 V102 Q68 114 84 116 Q96 116 99 110 Z' },
  { muscle: 'biceps', ellipse: [51, 116, 10, 24] },
  { muscle: 'forearms', rect: [35, 150, 18, 58, 9] },
  { muscle: 'quads', rect: [70, 214, 27, 84, 13] },
]
const FRONT_CENTRE: Shape[] = [{ muscle: 'abs', rect: [81, 120, 38, 72, 12] }]

const BACK: Shape[] = [
  { muscle: 'shoulders', ellipse: [64, 84, 15, 15] },
  { muscle: 'upperBack', d: 'M92 108 L79 82 Q68 86 68 100 L72 140 Q80 156 97 160 Z' },
  { muscle: 'triceps', ellipse: [51, 116, 10, 24] },
  { muscle: 'forearms', rect: [35, 150, 18, 58, 9] },
  { muscle: 'glutes', ellipse: [85, 210, 16, 16] },
  { muscle: 'hamstrings', rect: [70, 228, 27, 72, 13] },
  { muscle: 'calves', ellipse: [84, 336, 11, 28] },
]
const BACK_CENTRE: Shape[] = [
  { muscle: 'traps', d: 'M100 56 L124 76 L108 112 L100 118 L92 112 L76 76 Z' },
  { muscle: 'lowerBack', rect: [84, 162, 32, 32, 10] },
]

/** The parts with no muscle data: head, hands, joints, feet. */
function Silhouette() {
  const half = (
    <>
      <rect x={40} y={74} width={22} height={78} rx={11} />
      <rect x={34} y={150} width={20} height={62} rx={10} />
      <circle cx={43} cy={222} r={9} />
      <rect x={69} y={206} width={29} height={100} rx={14} />
      <rect x={72} y={304} width={24} height={94} rx={12} />
      <ellipse cx={82} cy={404} rx={13} ry={7} />
    </>
  )
  return (
    <g fill="var(--grid)">
      <circle cx={100} cy={34} r={20} />
      <rect x={91} y={52} width={18} height={16} rx={6} />
      <rect x={64} y={66} width={72} height={134} rx={22} />
      <rect x={68} y={188} width={64} height={30} rx={14} />
      {half}
      <g transform="translate(200,0) scale(-1,1)">{half}</g>
    </g>
  )
}

export function BodyMap({ sets, placed, unplaced, rangeTitle }: { sets: Record<Muscle, number>; placed: number; unplaced: number; rangeTitle: string }) {
  const [hover, setHover] = useState<Muscle | null>(null)
  const max = Math.max(...MUSCLES.map((m) => sets[m]))
  const step = (v: number) => (v <= 0 || max <= 0 ? 0 : Math.min(5, Math.max(1, Math.ceil((v / max) * 5))))
  const fill = (m: Muscle) => (step(sets[m]) ? `var(--z${step(sets[m])})` : 'var(--axis)')
  const ranked = [...MUSCLES].sort((a, b) => sets[b] - sets[a])

  const draw = (shape: Shape, key: string) => {
    const m = shape.muscle
    const props = {
      fill: fill(m),
      stroke: hover === m ? 'var(--ink)' : 'var(--surface)',
      strokeWidth: hover === m ? 2.5 : 1.5,
      onMouseEnter: () => setHover(m),
      onMouseLeave: () => setHover(null),
      style: { cursor: 'default', transition: 'stroke 120ms' },
    }
    const title = <title>{`${MUSCLE_LABEL[m]}: ${sets[m] ? `${fmtSets(sets[m])} sets` : 'not worked'}`}</title>
    if (shape.ellipse) {
      const [cx, cy, rx, ry] = shape.ellipse
      return <ellipse key={key} cx={cx} cy={cy} rx={rx} ry={ry} {...props}>{title}</ellipse>
    }
    if (shape.rect) {
      const [x, y, w, h, r] = shape.rect
      return <rect key={key} x={x} y={y} width={w} height={h} rx={r} {...props}>{title}</rect>
    }
    return <path key={key} d={shape.d} {...props}>{title}</path>
  }

  const figure = (sides: Shape[], centre: Shape[], dx: number, label: string) => (
    <g transform={`translate(${dx},0)`}>
      <Silhouette />
      {sides.map((s, i) => draw(s, `l${i}`))}
      <g transform="translate(200,0) scale(-1,1)">{sides.map((s, i) => draw(s, `r${i}`))}</g>
      {centre.map((s, i) => draw(s, `c${i}`))}
      <text x={100} y={428} textAnchor="middle" fontSize={12} fill="var(--muted)">{label}</text>
    </g>
  )

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-ink">Muscles worked</h3>
          <p className="mt-0.5 text-xs text-muted">Sets per muscle group, {rangeTitle}. Main muscles count in full, helper muscles count half.</p>
        </div>
        <SourceTag source="estimate" />
      </div>

      {placed === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-line px-4 text-center text-sm text-muted">
          No exercises identified by your watch in this range
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div>
            <svg viewBox="0 0 420 436" className="mx-auto w-full max-w-[420px]" role="img" aria-label="Front and back body diagrams shaded by sets per muscle group; the list beside it has the same figures">
              {figure(FRONT, FRONT_CENTRE, 0, 'Front')}
              {figure(BACK, BACK_CENTRE, 220, 'Back')}
            </svg>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[3px]" style={{ background: 'var(--axis)' }} />
                Not worked
              </span>
              <span className="inline-flex items-center gap-1.5">
                Fewer sets
                {[1, 2, 3, 4, 5].map((s) => <span key={s} className="h-3 w-3 rounded-[3px]" style={{ background: `var(--z${s})` }} />)}
                More sets
              </span>
            </div>
          </div>

          <ul className="text-sm" aria-label="Sets per muscle group">
            {ranked.map((m) => (
              <li
                key={m}
                tabIndex={0}
                onMouseEnter={() => setHover(m)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(m)}
                onBlur={() => setHover(null)}
                className={`grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-3 rounded-lg px-2 py-1.5 outline-none ${hover === m ? 'bg-wash' : ''}`}
              >
                <span className={sets[m] ? 'text-ink' : 'text-muted'}>{MUSCLE_LABEL[m]}</span>
                <span className="h-2 overflow-hidden rounded-full bg-wash">
                  <span className="block h-full rounded-full" style={{ width: `${max ? (sets[m] / max) * 100 : 0}%`, background: 'var(--s1)' }} />
                </span>
                <span className="text-right tabular-nums text-ink-2">{sets[m] ? fmtSets(sets[m]) : '–'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Based on {fmtSets(placed)} sets the watch identified.
        {unplaced > 0 && ` Another ${fmtSets(unplaced)} sets couldn't be identified and aren't shown.`} Which muscles an exercise
        works is this app&apos;s own mapping, not Garmin data.
      </p>
    </div>
  )
}
