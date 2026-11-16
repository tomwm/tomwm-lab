/** Next workout and insights: one structured request each, over a brief the app calculates. */
import 'server-only'
import type { Dataset } from '../data'
import { getAiResult, putAiResult } from '../garmin/db'
import { getStrengthPlan } from '../plan'
import { describeDay, getTrainingPlan, kindOfPlanned, type ItemKind, type PlannedDay } from '../trainingPlan'
import { unsupportedNumbers } from './check'
import { insightsBrief, workoutBrief } from './context'
import { AiError, getProvider } from './provider'

/** One session in a day's suggestion (a day can have two, e.g. a morning run and evening weights). */
export type WorkoutPart = {
  label: string
  type: 'run' | 'strength' | 'swim' | 'easy cardio' | 'hard cardio' | 'rest'
  /** The strength plan session this part is based on, if any. */
  planSession: string | null
  durationMin: number
  intensity: 'easy' | 'moderate' | 'hard'
  warmup: string
  main: { name: string; prescription: string; note?: string }[]
  cooldown: string
}
export type Workout = {
  title: string
  parts: WorkoutPart[]
  why: string[]
  /** The model's reasons for changing the plan. */
  changes: string[]
  /** What actually differs from the plan, worked out by the app (not the model). */
  diff?: string[]
  /** The day's plan as written, for display next to the suggestion. */
  plannedToday?: string | null
  caution?: string
}
export type Insight = { kind: 'going well' | 'watch' | 'try'; title: string; detail: string; evidence: string }
export type Insights = { summary: string; insights: Insight[] }

/** A stored answer, with what it was based on. */
export type CoachResult<T> = {
  result: T
  /** Figures quoted as evidence that weren't in the brief, by item index. */
  unverified: Record<number, string[]>
  brief: string
  model: string
  ms: number
  forDate: string
  generatedAt: number
}

const RULES = `Rules:
- Use only figures from the brief. Never invent numbers about this person. If something isn't recorded, don't guess.
- This is coaching, not medical advice. Don't diagnose.
- British English. Metric units. Pace as m:ss min/km. Dates like 3 Nov.`

const WORKOUT_SYSTEM = `You are a careful running and strength coach for one person. You receive a brief of their data, calculated by their dashboard, which may include a strength plan and a day-by-day training plan with this week's progress. Recommend what to do TODAY.
${RULES}
How to choose:
- If there is a TRAINING PLAN, today's plan is the starting point: give one part per planned session (e.g. "Morning" run, "Evening" weights), with the planned minutes, HR zones and structure. Change something only when the data justifies it (recovery, symptoms rule, a clash with tomorrow, a key session missed earlier this week), and give the reason for each change in "changes". It's a rough guide: never double up missed sessions.
- Without a training plan, base strength days on the strength plan (next session due) and fit runs on other days.
- For a strength part, copy the plan session's exercises, sets and reps exactly as written, and set "planSession" to its name. For other parts, "planSession" is "none".
- Prescribe runs, swims and cardio by minutes and HR zone (use the HEART RATE ZONES given, e.g. "Z2: 132–156 bpm"), not by pace or distance. Plan distances are only estimates.
- Hard cardio follows the plan's elliptical rotation when given.
- Respect recovery: if HRV is clearly below its 30-day average, resting HR clearly above it, sleep was short, or the last 7 days' load is well above the weekly average, make the day easier (shorter, easier zone, or rest) and say so.
- Always respect their limitations. For exercises that could aggravate a listed limitation, put a short swap in that item's "note" (e.g. "if it flares: <alternative>").
- Never prescribe weights in kg. Give lifting effort as reps in reserve (e.g. "2 RIR").
- A rest day is one part with type "rest", no main items.
- "why": 2 to 4 short reasons, each citing a figure or plan entry from the brief.
- "caution": only if the data warrants it, otherwise an empty string.`

const PART_SCHEMA = {
  type: 'object',
  required: ['label', 'type', 'planSession', 'durationMin', 'intensity', 'warmup', 'main', 'cooldown'],
  properties: {
    label: { type: 'string' },
    type: { type: 'string', enum: ['run', 'strength', 'swim', 'easy cardio', 'hard cardio', 'rest'] },
    planSession: { type: 'string' },
    durationMin: { type: 'integer' },
    intensity: { type: 'string', enum: ['easy', 'moderate', 'hard'] },
    warmup: { type: 'string' },
    main: {
      type: 'array',
      items: { type: 'object', required: ['name', 'prescription'], properties: { name: { type: 'string' }, prescription: { type: 'string' }, note: { type: 'string' } } },
    },
    cooldown: { type: 'string' },
  },
}

const WORKOUT_SCHEMA = {
  type: 'object',
  required: ['title', 'parts', 'why', 'changes', 'caution'],
  properties: {
    title: { type: 'string' },
    parts: { type: 'array', items: PART_SCHEMA },
    why: { type: 'array', items: { type: 'string' } },
    changes: { type: 'array', items: { type: 'string' } },
    caution: { type: 'string' },
  },
}

const INSIGHTS_SYSTEM = `You review one person's training and health data, from a brief calculated by their dashboard, and write insights for them.
${RULES}
- Write 3 to 5 insights. Mix what's going well, what to watch, and things to try.
- Each insight: "kind" (going well / watch / try), "title" (at most 8 words), "detail" (1 or 2 practical sentences tied to their goals), "evidence" (the exact figures from the brief behind it).
- Compare the last 30 days with the previous 30, and use the monthly trend where it helps.
- Comment on how well they're keeping to their training and strength plans (planned vs done minutes and sessions) and on their build-up towards their race, where the data supports it. Plan matching is a best guess and the plan is a rough guide, so don't be harsh about it.
- If missing data matters (e.g. few nights of sleep recorded), say so in a "watch" item.
- "summary": one sentence on how they're doing overall.`

const INSIGHTS_SCHEMA = {
  type: 'object',
  required: ['summary', 'insights'],
  properties: {
    summary: { type: 'string' },
    insights: {
      type: 'array',
      items: {
        type: 'object',
        required: ['kind', 'title', 'detail', 'evidence'],
        properties: { kind: { type: 'string', enum: ['going well', 'watch', 'try'] }, title: { type: 'string' }, detail: { type: 'string' }, evidence: { type: 'string' } },
      },
    },
  },
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

const PART_TYPES = ['run', 'strength', 'swim', 'easy cardio', 'hard cardio', 'rest'] as const

function parsePart(raw: unknown, names: string[]): WorkoutPart | null {
  const o = raw as Record<string, unknown>
  if (!o || typeof o !== 'object') return null
  const type = (PART_TYPES as readonly string[]).includes(o.type as string) ? (o.type as WorkoutPart['type']) : null
  const intensity = ['easy', 'moderate', 'hard'].includes(o.intensity as string) ? (o.intensity as WorkoutPart['intensity']) : 'easy'
  const main = Array.isArray(o.main)
    ? o.main.map((m) => ({ name: str((m as any)?.name), prescription: str((m as any)?.prescription), note: str((m as any)?.note) || undefined })).filter((m) => m.name)
    : []
  if (!type || (type !== 'rest' && !main.length)) return null
  return {
    label: str(o.label) || 'Session',
    type,
    planSession: type === 'strength' && names.includes(o.planSession as string) ? (o.planSession as string) : null,
    durationMin: Math.max(0, Math.min(300, Math.round(Number(o.durationMin) || 0))),
    intensity,
    warmup: str(o.warmup),
    main: main.slice(0, 10),
    cooldown: str(o.cooldown),
  }
}

function parseWorkout(raw: unknown): Workout | null {
  const o = raw as Record<string, unknown>
  if (!o || typeof o !== 'object' || !Array.isArray(o.parts)) return null
  const names = getStrengthPlan().map((p) => p.name)
  const parts = o.parts.map((p) => parsePart(p, names)).filter((p): p is WorkoutPart => !!p).slice(0, 3)
  const why = Array.isArray(o.why) ? o.why.map(str).filter(Boolean).slice(0, 5) : []
  if (!str(o.title) || !parts.length || !why.length) return null
  return {
    title: str(o.title),
    parts,
    why,
    // Models sometimes fill an empty list with "None" or "No changes".
    changes: Array.isArray(o.changes) ? o.changes.map(str).filter((c) => c && !/^(none|no changes?|n\/a)\b/i.test(c)).slice(0, 8) : [],
    caution: str(o.caution) || undefined,
  }
}

/** Older saved suggestions (one session, no parts) in the current shape. */
export function asParts(w: Workout & Partial<WorkoutPart>): Workout {
  if (Array.isArray(w.parts)) return w
  const legacyType = (w as { type?: string }).type
  return {
    ...w,
    parts: [
      {
        label: 'Session',
        type: legacyType === 'mixed' ? 'run' : ((legacyType as WorkoutPart['type']) ?? 'rest'),
        planSession: (w as { planSession?: string | null }).planSession ?? null,
        durationMin: w.durationMin ?? 0,
        intensity: w.intensity ?? 'easy',
        warmup: w.warmup ?? '',
        main: w.main ?? [],
        cooldown: w.cooldown ?? '',
      },
    ],
  }
}

function parseInsights(raw: unknown): Insights | null {
  const o = raw as Record<string, unknown>
  if (!o || typeof o !== 'object' || !Array.isArray(o.insights)) return null
  const insights = o.insights
    .map((i) => ({ kind: (i as any)?.kind, title: str((i as any)?.title), detail: str((i as any)?.detail), evidence: str((i as any)?.evidence) }))
    .filter((i): i is Insight => ['going well', 'watch', 'try'].includes(i.kind) && !!i.title && !!i.detail)
    .slice(0, 6)
  return insights.length ? { summary: str(o.summary), insights } : null
}

/** One structured request, retried once if the reply doesn't fit the shape. */
async function structured<T>(system: string, brief: string, schema: object, parse: (raw: unknown) => T | null) {
  const ai = getProvider()
  let ms = 0
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await ai.chat({ messages: [{ role: 'system', content: system }, { role: 'user', content: brief }], format: schema as Record<string, unknown> })
    ms += res.ms
    let raw: unknown = null
    try {
      raw = JSON.parse(res.content)
    } catch {
      /* retry */
    }
    const parsed = parse(raw)
    if (parsed) return { parsed, ms, model: ai.label }
  }
  throw new AiError('The model’s answer didn’t come back in a usable shape twice in a row. Try again.')
}

const norm = (s: string) => s.toLowerCase().replace(/[\u2013\u2014]/g, '-').replace(/\s+/g, ' ').replace(/ ?- ?/g, '-').trim()
const nameKey = (s: string) => norm(s).replace(/[^a-z ]/g, '').replace(/s\b/g, '')

/** Differences between one strength part and its plan session. */
function strengthDiff(part: WorkoutPart): string[] {
  const plan = getStrengthPlan().find((p) => p.name === part.planSession)
  if (!plan) return []
  const out: string[] = []
  const used = new Set<number>()
  for (const ex of plan.exercises) {
    const options = ex.name.split('/').map(nameKey)
    const i = part.main.findIndex((m, j) => !used.has(j) && options.some((o) => nameKey(m.name).includes(o) || o.includes(nameKey(m.name))))
    if (i < 0) {
      out.push(`${plan.name} · ${ex.name}: left out`)
      continue
    }
    used.add(i)
    const want = norm(`${ex.sets}x${ex.reps}`)
    const got = norm(part.main[i].prescription).replace(/ ?[x×] ?/, 'x')
    if (!got.startsWith(want)) out.push(`${plan.name} · ${ex.name}: ${ex.sets} × ${ex.reps} in the plan, ${part.main[i].prescription} here`)
  }
  part.main.forEach((m, j) => {
    if (!used.has(j)) out.push(`${plan.name} · ${m.name}: added (not in the plan)`)
  })
  return out
}

const PART_KIND: Record<WorkoutPart['type'], ItemKind | null> = { run: 'run', strength: 'weights', swim: 'swim', 'easy cardio': 'elliptical', 'hard cardio': 'elliptical', rest: null }

/**
 * Compare a suggestion with today's plan, so the "changed" list comes from
 * the app rather than from the model's own account.
 */
export function planDiff(w: Workout, today: PlannedDay | null): string[] {
  const out: string[] = []
  const parts = w.parts.filter((p) => p.type !== 'rest')
  if (today) {
    const planned = [today.main, today.weights].filter((x): x is NonNullable<typeof x> => !!x)
    const used = new Set<number>()
    for (const p of planned) {
      const kind = kindOfPlanned(p.activity)
      const label = 'session' in p ? (p as { session: string }).session : p.activity
      const i = parts.findIndex((x, j) => !used.has(j) && (PART_KIND[x.type] === kind || (kind === 'stepper' && x.type.includes('cardio'))))
      if (i < 0) {
        out.push(`${label} ${p.minutes} min: left out`)
        continue
      }
      used.add(i)
      const part = parts[i]
      if (kind === 'weights' && part.planSession && part.planSession !== label) out.push(`${label} swapped for ${part.planSession}`)
      else if (kind !== 'weights' && part.durationMin && Math.abs(part.durationMin - p.minutes) >= 5) out.push(`${label}: ${p.minutes} min in the plan, ${part.durationMin} min here`)
    }
    parts.forEach((x, j) => {
      if (!used.has(j)) out.push(`${x.planSession ?? x.label}: added (not in today's plan)`)
    })
  }
  for (const part of parts) if (part.type === 'strength') out.push(...strengthDiff(part))
  return out
}

export async function suggestWorkout(data: Dataset, today: string): Promise<CoachResult<Workout>> {
  const brief = workoutBrief(data, today)
  const names = [...getStrengthPlan().map((p) => p.name), 'none']
  const schema = {
    ...WORKOUT_SCHEMA,
    properties: { ...WORKOUT_SCHEMA.properties, parts: { type: 'array', items: { ...PART_SCHEMA, properties: { ...PART_SCHEMA.properties, planSession: { type: 'string', enum: names } } } } },
  }
  const { parsed, ms, model } = await structured(WORKOUT_SYSTEM, brief, schema, parseWorkout)
  const plannedDay = getTrainingPlan()?.days.get(today) ?? null
  parsed.plannedToday = plannedDay ? describeDay(plannedDay) : null
  parsed.diff = planDiff(parsed, plannedDay)
  const unverified: Record<number, string[]> = {}
  parsed.why.forEach((w, i) => {
    const bad = unsupportedNumbers(w, brief)
    if (bad.length) unverified[i] = bad
  })
  const out = { result: parsed, unverified, brief, model, ms, forDate: today, generatedAt: Date.now() }
  putAiResult('workout', out)
  return out
}

export async function writeInsights(data: Dataset, today: string): Promise<CoachResult<Insights>> {
  const brief = insightsBrief(data, today)
  const { parsed, ms, model } = await structured(INSIGHTS_SYSTEM, brief, INSIGHTS_SCHEMA, parseInsights)
  const unverified: Record<number, string[]> = {}
  parsed.insights.forEach((ins, i) => {
    const bad = unsupportedNumbers(`${ins.evidence} ${ins.detail}`, brief)
    if (bad.length) unverified[i] = bad
  })
  const out = { result: parsed, unverified, brief, model, ms, forDate: today, generatedAt: Date.now() }
  putAiResult('insights', out)
  return out
}

export const storedWorkout = () => {
  const r = getAiResult<CoachResult<Workout>>('workout')
  return r ? { ...r, result: asParts(r.result as Workout & Partial<WorkoutPart>) } : null
}
export const storedInsights = () => getAiResult<CoachResult<Insights>>('insights')
