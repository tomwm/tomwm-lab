'use client'

import { useEffect, useRef, useState } from 'react'
import type { AskResult, Turn } from '@/lib/ai/ask'
import type { CoachResult, Insights, Workout, WorkoutPart } from '@/lib/ai/coach'
import type { PlanSession } from '@/lib/plan'
import type { DayItem } from '@/lib/trainingPlan'
import { SourceTag } from '../Kpi'

// ---------------------------------------------------------------- helpers

async function callCoach<T>(payload: object): Promise<T> {
  const res = await fetch('/api/coach', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  const json = await res.json().catch(() => ({ error: 'The app returned an unreadable response.' }))
  if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`)
  return json as T
}

/** Seconds since `since`, ticking while active. */
function useElapsed(active: boolean) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!active) return
    const start = Date.now()
    setSecs(0)
    const t = setInterval(() => setSecs(Math.round((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(t)
  }, [active])
  return secs
}

const time = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const youtube = (name: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to ${name}`)}`

const BTN = 'inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-page transition-opacity hover:opacity-90 disabled:opacity-50'
const GHOST = 'rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 hover:text-ink disabled:opacity-50'

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          {action}
          <SourceTag source="ai" />
        </div>
      </div>
      {children}
    </section>
  )
}

function Thinking({ secs, typical }: { secs: number; typical: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-wash px-4 py-6 text-sm text-ink-2" role="status">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      Thinking… {secs}s <span className="text-muted">(usually {typical}; the first run after a break is slower while the model loads)</span>
    </div>
  )
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl border border-line px-4 py-3 text-sm text-bad">
      ⚠ {message}
    </p>
  )
}

/** Shown beside a sentence whose figures don't appear in the data the model was given. */
function Unverified({ nums }: { nums?: string[] }) {
  if (!nums?.length) return null
  return (
    <span
      className="ml-1.5 inline-flex items-center gap-1 rounded-full border border-line px-1.5 py-px align-middle text-[10px] font-medium text-[var(--s4)]"
      title={`${nums.join(', ')} isn't in the data the coach was given. Double-check before relying on it.`}
    >
      ⚠ check {nums.join(', ')}
    </span>
  )
}

function Footer({ r, onAgain, busy, label }: { r: CoachResult<unknown>; onAgain: () => void; busy: boolean; label: string }) {
  return (
    <div className="mt-5 border-t border-line pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {r.model} · {Math.round(r.ms / 1000)}s · {time(r.generatedAt)}, {dayLabel(r.forDate)} · not medical advice
        </span>
        <button type="button" onClick={onAgain} disabled={busy} className={GHOST}>
          {label}
        </button>
      </div>
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer select-none hover:text-ink">What the coach was given</summary>
        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-wash p-3 font-sans leading-relaxed text-ink-2">{r.brief}</pre>
      </details>
    </div>
  )
}

// ---------------------------------------------------------------- workout

const TYPE_LABEL: Record<WorkoutPart['type'], string> = { run: 'Run', strength: 'Strength', swim: 'Swim', 'easy cardio': 'Easy cardio', 'hard cardio': 'Hard cardio', rest: 'Rest' }

function PartBlock({ part, solo }: { part: WorkoutPart; solo: boolean }) {
  return (
    <div className={solo ? 'mt-4' : 'mt-5 border-t border-line pt-4'}>
      {!solo && <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">{part.label}</p>}
      <p className={`${solo ? '' : 'mt-1 '}text-sm font-semibold`}>
        {part.planSession ? `${part.planSession} · ` : ''}
        {TYPE_LABEL[part.type]}
        <span className="font-normal text-ink-2">
          {part.durationMin ? ` · ${part.durationMin} min` : ''} · {part.intensity}
        </span>
      </p>
      {part.warmup && (
        <p className="mt-2 text-sm">
          <span className="font-medium">Warm-up:</span> <span className="text-ink-2">{part.warmup}</span>
        </p>
      )}
      {part.main.length > 0 && (
        <table className="mt-2 w-full text-sm">
          <tbody>
            {part.main.map((m, i) => (
              <tr key={i} className="border-t border-line align-top">
                <td className="py-2 pr-3">
                  {part.type === 'strength' ? (
                    <a href={youtube(m.name)} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--axis)] underline-offset-2 hover:decoration-current" title="Search YouTube for how to do it (opens in a new tab)">
                      {m.name}
                    </a>
                  ) : (
                    m.name
                  )}
                  {m.note && <div className="text-xs text-muted">{m.note}</div>}
                </td>
                <td className="py-2 text-right tabular-nums text-ink-2">{m.prescription}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {part.cooldown && (
        <p className="mt-2 text-sm">
          <span className="font-medium">Cool-down:</span> <span className="text-ink-2">{part.cooldown}</span>
        </p>
      )}
    </div>
  )
}

function WorkoutCard({ today, initial, disabled }: { today: string; initial: CoachResult<Workout> | null; disabled: boolean }) {
  const [r, setR] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const secs = useElapsed(busy)
  const go = async () => {
    setBusy(true)
    setError(null)
    try {
      setR(await callCoach<CoachResult<Workout>>({ action: 'workout' }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const stale = r && r.forDate !== today
  const w = r?.result

  return (
    <Card title="Today's workout">
      {busy ? (
        <Thinking secs={secs} typical="20–30 seconds" />
      ) : !w ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-ink-2">Today&apos;s sessions, starting from your plan and adjusted for last night&apos;s recovery and the last two weeks of training.</p>
          <button type="button" onClick={go} disabled={disabled} className={BTN}>
            Suggest today&apos;s workout
          </button>
        </div>
      ) : null}
      {error && <div className="mt-3"><ErrorNote message={error} /></div>}

      {w && !busy && (
        <div>
          {stale && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-wash px-3 py-2 text-xs text-ink-2">
              This was suggested for {dayLabel(r!.forDate)}.
              <button type="button" onClick={go} disabled={disabled} className={GHOST}>
                Suggest one for today
              </button>
            </div>
          )}
          <h3 className="text-xl font-semibold tracking-tight">{w.title}</h3>
          {w.plannedToday !== undefined && (
            <p className="mt-1 text-sm text-ink-2">
              <span className="text-muted">Your plan today:</span> {w.plannedToday ?? 'nothing planned'}
            </p>
          )}

          <h4 className="mb-1.5 mt-5 text-xs font-medium uppercase tracking-[0.1em] text-muted">Why today</h4>
          <ul className="space-y-1.5 text-sm">
            {w.why.map((x, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted">•</span>
                <span>
                  {x}
                  <Unverified nums={r!.unverified[i]} />
                </span>
              </li>
            ))}
          </ul>

          {(w.plannedToday || w.parts.some((p) => p.planSession)) && (
            <>
              <h4 className="mb-1.5 mt-5 text-xs font-medium uppercase tracking-[0.1em] text-muted">Changed from your plan</h4>
              {(w.diff ?? []).length === 0 ? (
                <p className="text-sm text-ink-2">Nothing: as written in your plan.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {w.diff!.map((x, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted">•</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              )}
              {(w.changes ?? []).length > 0 && (
                <div className="mt-2 text-xs text-muted">
                  <span className="font-medium text-ink-2">Coach&apos;s reasons:</span> {w.changes.join(' ')}
                </div>
              )}
              <p className="mt-1 text-[11px] text-muted">The list is checked by the app against your plans; the reasons are the coach&apos;s.</p>
            </>
          )}

          {w.parts.map((part, i) => (
            <PartBlock key={i} part={part} solo={w.parts.length === 1} />
          ))}
          {w.caution && (
            <p className="mt-4 rounded-xl border border-line px-3 py-2 text-sm">
              <span className="font-medium text-[var(--s4)]">⚠ Caution:</span> {w.caution}
            </p>
          )}
          <Footer r={r!} onAgain={go} busy={busy || disabled} label="Suggest another" />
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------- insights

const KIND: Record<string, { icon: string; label: string; color: string }> = {
  'going well': { icon: '✓', label: 'Going well', color: 'var(--good)' },
  watch: { icon: '!', label: 'Watch', color: 'var(--s4)' },
  try: { icon: '→', label: 'Try', color: 'var(--s1)' },
}

function InsightsCard({ initial, disabled }: { initial: CoachResult<Insights> | null; disabled: boolean }) {
  const [r, setR] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const secs = useElapsed(busy)
  const go = async () => {
    setBusy(true)
    setError(null)
    try {
      setR(await callCoach<CoachResult<Insights>>({ action: 'insights' }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const ageDays = r ? Math.floor((Date.now() - r.generatedAt) / 86_400_000) : 0

  return (
    <Card title="How you're doing">
      {busy ? (
        <Thinking secs={secs} typical="30–60 seconds" />
      ) : !r ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-ink-2">Three to five observations on the last month against the one before, and your longer trends.</p>
          <button type="button" onClick={go} disabled={disabled} className={BTN}>
            Review my data
          </button>
        </div>
      ) : null}
      {error && <div className="mt-3"><ErrorNote message={error} /></div>}

      {r && !busy && (
        <div>
          {ageDays >= 7 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-wash px-3 py-2 text-xs text-ink-2">
              Written {ageDays} days ago.
              <button type="button" onClick={go} disabled={disabled} className={GHOST}>
                Review again
              </button>
            </div>
          )}
          {r.result.summary && <p className="text-[15px] leading-relaxed">{r.result.summary}</p>}
          <ul className="mt-4 space-y-4">
            {r.result.insights.map((ins, i) => {
              const k = KIND[ins.kind]
              return (
                <li key={i} className="border-t border-line pt-3">
                  <div className="flex items-center gap-2 text-xs font-medium" style={{ color: k.color }}>
                    <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px]" style={{ borderColor: k.color }}>
                      {k.icon}
                    </span>
                    {k.label}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold">{ins.title}</h3>
                  <p className="mt-0.5 text-sm text-ink-2">
                    {ins.detail}
                    <Unverified nums={r.unverified[i]} />
                  </p>
                  {ins.evidence && <p className="mt-1 text-xs text-muted">Based on: {ins.evidence}</p>}
                </li>
              )
            })}
          </ul>
          <Footer r={r} onAgain={go} busy={busy || disabled} label="Review again" />
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------- questions

/** Just enough Markdown for model answers: paragraphs, bullet lists, **bold**. */
function Prose({ text }: { text: string }) {
  const inline = (s: string) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p))
  const blocks: React.ReactNode[] = []
  let list: string[] = []
  const flush = () => {
    if (list.length) blocks.push(<ul key={blocks.length} className="ml-4 list-disc space-y-1">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>)
    list = []
  }
  for (const line of text.split('\n')) {
    const m = /^\s*(?:[-*•]|\d+\.)\s+(.*)$/.exec(line)
    if (m) list.push(m[1])
    else {
      flush()
      if (line.trim()) blocks.push(<p key={blocks.length}>{inline(line.replace(/^#+\s*/, ''))}</p>)
    }
  }
  flush()
  return <div className="space-y-2 text-sm leading-relaxed">{blocks}</div>
}

const EXAMPLES = [
  'How has my running changed this year?',
  'When did I last train legs?',
  'Has my resting heart rate improved since the summer?',
  'How has my weight changed over the last six months?',
]

type Exchange = { q: string; a?: AskResult; error?: string }

function AskCard({ disabled }: { disabled: boolean }) {
  const [log, setLog] = useState<Exchange[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const secs = useElapsed(busy)
  const end = useRef<HTMLDivElement>(null)
  // Braces matter: newer browsers return a Promise from scrollIntoView, which React would treat as a cleanup.
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [log, busy])

  const ask = async (question: string) => {
    const text = question.trim()
    if (!text || busy) return
    const history: Turn[] = log.flatMap((x) => (x.a ? [{ role: 'user' as const, content: x.q }, { role: 'assistant' as const, content: x.a.answer }] : []))
    setLog((l) => [...l, { q: text }])
    setQ('')
    setBusy(true)
    try {
      const a = await callCoach<AskResult>({ action: 'ask', question: text, history })
      setLog((l) => l.map((x, i) => (i === l.length - 1 ? { ...x, a } : x)))
    } catch (e) {
      setLog((l) => l.map((x, i) => (i === l.length - 1 ? { ...x, error: (e as Error).message } : x)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Ask about your data" action={log.length > 0 ? <button type="button" onClick={() => setLog([])} disabled={busy} className={GHOST}>Clear</button> : undefined}>
      {log.length === 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button key={e} type="button" onClick={() => ask(e)} disabled={disabled || busy} className={GHOST}>
              {e}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-5">
        {log.map((x, i) => (
          <div key={i}>
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl bg-wash px-3.5 py-2 text-sm">{x.q}</p>
            {x.a && (
              <div className="mt-3">
                <Prose text={x.a.answer} />
                <p className="mt-2 text-xs text-muted">
                  {x.a.lookups.length ? `Looked up: ${x.a.lookups.map((l) => l.label).join(' · ')}` : 'Answered without looking anything up, so treat any figures with care.'} · {Math.round(x.a.ms / 1000)}s
                </p>
              </div>
            )}
            {x.error && <div className="mt-3"><ErrorNote message={x.error} /></div>}
          </div>
        ))}
        {busy && <Thinking secs={secs} typical="10–40 seconds, longer if it looks up several things" />}
        <div ref={end} />
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          ask(q)
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. What was my longest run in 2022?"
          aria-label="Your question"
          disabled={disabled}
          maxLength={500}
          className="min-w-0 flex-1 rounded-full border border-line bg-page px-4 py-2 text-sm outline-none placeholder:text-muted focus:border-[var(--axis)]"
        />
        <button type="submit" disabled={disabled || busy || !q.trim()} className={BTN}>
          Ask
        </button>
      </form>
      <p className="mt-3 text-xs text-muted">Answers come from a small local model. It looks figures up rather than guessing, but can still get things wrong.</p>
    </Card>
  )
}

// ---------------------------------------------------------------- plan

export type PlanWeekView = {
  weekStart: string
  next: string | null
  extra: number
  sessions: (PlanSession & { done: { date: string; how: 'exercises' | 'order' } | null })[]
}

const DAY = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function PlanCard({ week }: { week: PlanWeekView }) {
  const [open, setOpen] = useState<string | null>(null)
  const doneCount = week.sessions.filter((s) => s.done).length
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Your plan this week</h2>
          <p className="mt-0.5 text-xs text-muted">
            {doneCount} of {week.sessions.length} done since Mon {dayLabel(week.weekStart).split(' ').slice(1).join(' ')}
            {week.extra > 0 && ` · plus ${week.extra} other strength session${week.extra === 1 ? '' : 's'}`}
          </p>
        </div>
        <SourceTag source="estimate" />
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {week.sessions.map((s) => (
          <li key={s.key} className={`rounded-xl border p-3 ${week.next === s.key ? 'border-[var(--s7)]' : 'border-line'}`}>
            <button type="button" onClick={() => setOpen(open === s.key ? null : s.key)} aria-expanded={open === s.key} className="w-full text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{s.name}</span>
                <span className="text-xs text-muted">usually {DAY[s.day]}</span>
              </div>
              <p className="text-xs text-muted">{s.emphasis}</p>
              <p className="mt-2 text-xs">
                {s.done ? (
                  <span className="text-good">
                    ✓ Done {dayLabel(s.done.date)}
                    {s.done.how === 'order' && <span className="text-muted"> · probably</span>}
                  </span>
                ) : week.next === s.key ? (
                  <span className="font-medium text-[var(--s7)]">→ Next up</span>
                ) : (
                  <span className="text-muted">Not done yet</span>
                )}
              </p>
            </button>
            {open === s.key && (
              <ol className="mt-3 space-y-1 border-t border-line pt-2 text-xs">
                {s.exercises.map((e) => (
                  <li key={e.name} className="flex justify-between gap-2">
                    <span>{e.name}</span>
                    <span className="shrink-0 tabular-nums text-muted">{e.sets} × {e.reps}</span>
                  </li>
                ))}
                {s.optional && <li className="pt-1 text-muted">Running-heavy weeks: {s.optional}.</li>}
              </ol>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Matched from your watch&apos;s strength sessions. Garmin doesn&apos;t say which plan session you did, so this is a best guess from the exercises it
        recognised; &ldquo;probably&rdquo; means it went by the plan&apos;s order. Tap a session to see its exercises.
      </p>
    </section>
  )
}

// ---------------------------------------------------------------- training plan week

export type TrainingWeekView = {
  raceName: string | null
  weeksToRace: number | null
  weekNumber: number | null
  totalWeeks: number | null
  phase: string | null
  note: string | null
  totals: { plannedRunMin: number; plannedRunMinToDate: number; actualRunMin: number; actualRunKm: number; plannedGym: number; actualGym: number; plannedCrossMin: number; actualCrossMin: number }
  days: { date: string; items: DayItem[]; actual: { label: string; minutes: number; km: number | null }[] }[]
}

function Status({ item }: { item: DayItem }) {
  if (item.done === true) return <span className="text-good" title={item.doneOn ? `Done on ${dayLabel(item.doneOn)}` : 'Done'}>✓</span>
  if (item.done === false) return <span className={item.optional ? 'text-muted' : 'text-bad'} title={item.optional ? 'Optional, not done' : 'Missed'}>✗</span>
  return <span className="text-muted" title="Still to come">○</span>
}

function TrainingWeekCard({ w, today }: { w: TrainingWeekView; today: string }) {
  const t = w.totals
  const stat = (label: string, done: string, of: string) => (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-sm">
        <span className="font-semibold tabular-nums">{done}</span> <span className="text-muted">of {of}</span>
      </div>
    </div>
  )
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">This week&apos;s training plan</h2>
          <p className="mt-0.5 text-xs text-muted">
            {w.weekNumber ? `Week ${w.weekNumber}${w.totalWeeks ? ` of ${w.totalWeeks}` : ''}` : 'Outside the plan dates'}
            {w.phase ? ` · ${w.phase}` : ''}
            {w.weeksToRace !== null ? ` · ${w.weeksToRace} weeks to ${w.raceName ?? 'race day'}` : ''}
          </p>
        </div>
        <SourceTag source="estimate" />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-wash px-4 py-3">
        {stat('Running', `${Math.round(t.actualRunMin)} min`, `${t.plannedRunMin} min`)}
        {stat('Gym', `${t.actualGym}`, `${t.plannedGym}`)}
        {stat('Cross-training', `${Math.round(t.actualCrossMin)} min`, `${t.plannedCrossMin} min`)}
      </div>
      <ul className="divide-y divide-line text-sm">
        {w.days.map((d) => (
          <li key={d.date} className={`grid grid-cols-[4.5rem_1fr] gap-3 py-2 sm:grid-cols-[5.5rem_1fr_1fr] ${d.date === today ? 'rounded-lg bg-wash px-2' : ''}`}>
            <span className={d.date === today ? 'font-semibold' : 'text-ink-2'}>
              {dayLabel(d.date).split(' ').slice(0, 2).join(' ')}
              {d.date === today && <span className="block text-[10px] font-medium uppercase tracking-wide text-[var(--s7)]">Today</span>}
            </span>
            <span>
              {d.items.length === 0 ? (
                <span className="text-muted">Rest</span>
              ) : (
                d.items.map((i, k) => (
                  <span key={k} className="mr-3 inline-flex items-center gap-1.5 whitespace-nowrap">
                    <Status item={i} />
                    <span className={i.optional ? 'text-muted' : ''}>
                      {i.label} {i.minutes} min{i.optional ? ' (optional)' : ''}
                      {i.doneOn && <span className="text-xs text-muted"> · done {dayLabel(i.doneOn).split(' ')[0]}</span>}
                    </span>
                  </span>
                ))
              )}
            </span>
            <span className="col-start-2 text-xs text-muted sm:col-start-auto sm:text-sm">
              {d.actual.length
                ? `Did: ${d.actual.map((a) => `${a.label} ${a.minutes} min${a.km ? ` · ${a.km.toFixed(1)} km` : ''}`).join(', ')}`
                : d.date <= today
                  ? 'Nothing recorded'
                  : ''}
            </span>
          </li>
        ))}
      </ul>
      {w.note && <p className="mt-3 text-xs text-muted">This week: {w.note}</p>}
      <p className="mt-1 text-xs text-muted">
        ✓ done · ✗ missed · ○ still to come. Matched from what your watch recorded each day; weights sessions count wherever they fell in the week.
      </p>
    </section>
  )
}

// ---------------------------------------------------------------- page

export function Coach({
  today,
  model,
  problem,
  initialWorkout,
  initialInsights,
  week,
  trainingWeek,
}: {
  week: PlanWeekView
  trainingWeek: TrainingWeekView | null
  today: string
  model: string
  problem: string | null
  initialWorkout: CoachResult<Workout> | null
  initialInsights: CoachResult<Insights> | null
}) {
  return (
    <div className="space-y-4">
      {problem && (
        <div role="alert" className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm">
          <p className="font-medium">The coach can&apos;t reach {model}.</p>
          <p className="mt-1 text-ink-2">{problem}</p>
        </div>
      )}
      {trainingWeek && <TrainingWeekCard w={trainingWeek} today={today} />}
      {week.sessions.length > 0 && <PlanCard week={week} />}
      <div className="grid gap-4 lg:grid-cols-2">
        <WorkoutCard today={today} initial={initialWorkout} disabled={!!problem} />
        <InsightsCard initial={initialInsights} disabled={!!problem} />
      </div>
      <AskCard disabled={!!problem} />
    </div>
  )
}
