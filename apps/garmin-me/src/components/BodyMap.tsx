'use client'

import { useState } from 'react'
import { BEST, type Suggestion } from '@/lib/exerciseLibrary'
import { MUSCLE_LABEL, MUSCLES, type DoneRow, type Muscle } from '@/lib/muscles'
import { SourceTag } from './Kpi'

/**
 * Front and back body outlines with each muscle group shaded by weighted
 * sets, beside a ranked list with the exact numbers. Hovering either side
 * highlights the same muscle in both; clicking a muscle opens a panel with
 * the exercises you did for it and the ones that work it best.
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

export function BodyMap({
  sets,
  placed,
  unplaced,
  rangeTitle,
  done,
}: {
  sets: Record<Muscle, number>
  placed: number
  unplaced: number
  rangeTitle: string
  /** Exercises you did for each muscle in this range. */
  done: Record<Muscle, DoneRow[]>
}) {
  const [hover, setHover] = useState<Muscle | null>(null)
  const [picked, setPicked] = useState<Muscle | null>(null)
  const pick = (m: Muscle) => setPicked((p) => (p === m ? null : m))
  const lit = (m: Muscle) => hover === m || picked === m
  const max = Math.max(...MUSCLES.map((m) => sets[m]))
  const step = (v: number) => (v <= 0 || max <= 0 ? 0 : Math.min(5, Math.max(1, Math.ceil((v / max) * 5))))
  const fill = (m: Muscle) => (step(sets[m]) ? `var(--z${step(sets[m])})` : 'var(--axis)')
  const ranked = [...MUSCLES].sort((a, b) => sets[b] - sets[a])

  const draw = (shape: Shape, key: string) => {
    const m = shape.muscle
    const props = {
      fill: fill(m),
      stroke: lit(m) ? 'var(--ink)' : 'var(--surface)',
      strokeWidth: picked === m ? 3 : hover === m ? 2.5 : 1.5,
      onMouseEnter: () => setHover(m),
      onMouseLeave: () => setHover(null),
      onClick: () => pick(m),
      style: { cursor: 'pointer', transition: 'stroke 120ms' },
    }
    const title = <title>{`${MUSCLE_LABEL[m]}: ${sets[m] ? `${fmtSets(sets[m])} sets` : 'not worked'}. Click for exercises.`}</title>
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
          <p className="mt-0.5 text-xs text-muted">
            Sets per muscle group, {rangeTitle}. Main muscles count in full, helper muscles count half. Click a muscle for exercises.
          </p>
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
                onClick={() => pick(m)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(m))}
                role="button"
                aria-pressed={picked === m}
                className={`grid cursor-pointer grid-cols-[8.5rem_1fr_3.5rem] items-center gap-3 rounded-lg px-2 py-1.5 outline-none ${lit(m) ? 'bg-wash' : ''} ${picked === m ? 'ring-1 ring-inset ring-[var(--axis)]' : ''}`}
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

      {picked && <MusclePanel muscle={picked} sets={sets[picked]} done={done[picked]} rangeTitle={rangeTitle} onClose={() => setPicked(null)} />}

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Based on {fmtSets(placed)} sets the watch identified.
        {unplaced > 0 && ` Another ${fmtSets(unplaced)} sets couldn't be identified and aren't shown.`} Which muscles an exercise
        works is this app&apos;s own mapping, not Garmin data.
      </p>
    </div>
  )
}

/** A YouTube search for a demonstration of the exercise. */
const youtubeSearch = (name: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to ${name}`)}`

function SuggestionList({ title, items }: { title: string; items: Suggestion[] }) {
  return (
    <div>
      <h5 className="mb-1.5 text-xs font-medium text-ink-2">{title}</h5>
      <ol className="space-y-1.5 text-sm">
        {items.map((x, i) => (
          <li key={x.name} className="flex gap-2">
            <span className="w-4 shrink-0 text-right text-xs leading-5 tabular-nums text-muted">{i + 1}</span>
            <span className="leading-5">
              <a
                href={youtubeSearch(x.name)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Search YouTube for how to do ${x.name.toLowerCase()} (opens in a new tab)`}
                className="underline decoration-[var(--axis)] underline-offset-2 hover:text-ink hover:decoration-current"
              >
                {x.name}
                <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden className="ml-1 inline-block align-baseline opacity-60">
                  <path d="M5 2H2v8h8V7M7 2h3v3M10 2 5.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="sr-only"> (YouTube search, opens in a new tab)</span>
              </a>
              {x.note && <span className="text-muted"> · {x.note}</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Opened by clicking a muscle: what you did for it, and what works it best. */
function MusclePanel({ muscle, sets, done, rangeTitle, onClose }: { muscle: Muscle; sets: number; done: DoneRow[]; rangeTitle: string; onClose: () => void }) {
  const lib = BEST[muscle]
  return (
    <section aria-label={`${MUSCLE_LABEL[muscle]} exercises`} className="mt-5 rounded-xl border border-line bg-raised p-4 md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold tracking-tight">{MUSCLE_LABEL[muscle]}</h4>
          <p className="mt-0.5 text-xs text-muted">{sets ? `${fmtSets(sets)} sets ${rangeTitle}` : `Not worked ${rangeTitle}`}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-2 hover:bg-wash hover:text-ink">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h5 className="mb-1.5 flex items-center gap-2 text-xs font-medium text-ink-2">
            What you did
            <SourceTag source="garmin" />
          </h5>
          {done.length === 0 ? (
            <p className="text-sm text-muted">Nothing that works this muscle</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {done.slice(0, 8).map((d) => (
                <li key={d.name} className="flex items-baseline justify-between gap-3">
                  <span className="leading-5">
                    {d.name}
                    {d.role === 'helper' && <span className="text-muted"> · helper</span>}
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-2">{fmtSets(d.sets)} sets</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <SuggestionList title="Best with free weights & bodyweight" items={lib.free} />
        <SuggestionList title="Best with machines & cables" items={lib.machine} />
      </div>
      <p className="mt-4 text-xs text-muted">Suggestions are general gym guidance, best first, not personalised advice. Each name links to a YouTube search for demonstrations.</p>
    </section>
  )
}
