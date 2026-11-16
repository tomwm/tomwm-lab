/**
 * Plain-English questions about your history. The model gets read-only
 * lookup tools over the local data and decides what to fetch; the tools
 * return figures the app has calculated, never raw Garmin JSON.
 */
import 'server-only'
import type { Dataset } from '../data'
import { addDays, addMonths, diffDays, fmtDay, fmtWeekday, monthStart, mondayOf, today as todayFn } from '../dates'
import { fmtHours, fmtOne, fmtPace } from '../format'
import { SPORT_LABEL, SPORTS, type Day, type Sport } from '../garmin/normalize'
import { actsIn, dayList, mean, nums, sum } from '../metrics'
import { MUSCLE_LABEL, MUSCLES, muscleWork, topExercises } from '../muscles'
import { activityLine } from './context'
import { describeDay, getTrainingPlan, weekVsPlan } from '../trainingPlan'
import { getProfile } from './profile'
import { AiError, getProvider, type AiMessage, type ToolDef } from './provider'

const MAX_STEPS = 6
const r1 = (v: number) => fmtOne(v).replace(',', '')
const avg = (ds: Day[], pick: (d: Day) => number | null, f: (v: number) => string) => {
  const v = mean(nums(ds.map(pick)))
  return v === null ? 'not recorded' : f(v)
}

const DATE = { type: 'string', description: 'YYYY-MM-DD' }
const TOOLS: ToolDef[] = [
  {
    name: 'get_period_summary',
    description: 'Totals and averages for a date range: sessions and time by sport, running distance and pace, average sleep, HRV, resting heart rate, steps, stress, and weight at the start and end. Use this first for most questions about a period.',
    parameters: { type: 'object', required: ['start', 'end'], properties: { start: DATE, end: DATE } },
  },
  {
    name: 'list_activities',
    description: 'List individual sessions in a date range (newest first, up to 40), optionally only one sport. Each has date, sport, name, duration, distance, pace, average heart rate, load and recognised strength exercises.',
    parameters: {
      type: 'object',
      required: ['start', 'end'],
      properties: { start: DATE, end: DATE, sport: { type: 'string', enum: ['any', ...SPORTS] } },
    },
  },
  {
    name: 'get_daily_health',
    description: 'Sleep, sleep score, HRV, resting heart rate, Body Battery, steps and stress over a date range. Up to 45 days returns each day; longer ranges return weekly or monthly averages.',
    parameters: { type: 'object', required: ['start', 'end'], properties: { start: DATE, end: DATE } },
  },
  {
    name: 'get_strength',
    description: 'Strength training in a date range: weighted sets per muscle group and the most-done exercises with sets and reps.',
    parameters: { type: 'object', required: ['start', 'end'], properties: { start: DATE, end: DATE } },
  },
  {
    name: 'get_training_plan',
    description: 'What their training plan says for a date range, and for past days what they actually did. Up to 45 days returns each day; longer ranges return weekly totals (planned vs done).',
    parameters: { type: 'object', required: ['start', 'end'], properties: { start: DATE, end: DATE } },
  },
  {
    name: 'get_weight',
    description: 'Weigh-ins (weight, body fat, muscle mass) in a date range. Long ranges return the last weigh-in of each month.',
    parameters: { type: 'object', required: ['start', 'end'], properties: { start: DATE, end: DATE } },
  },
]

type Range = { start: string; end: string; note: string }

/** Validate and clamp a tool's date range to the data we hold. */
function range(args: Record<string, unknown>, data: Dataset, today: string, future = false): Range | string {
  const ok = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
  if (!ok(args.start) || !ok(args.end)) return 'Error: start and end must be dates as YYYY-MM-DD.'
  let [start, end] = [args.start as string, args.end as string]
  if (start > end) [start, end] = [end, start]
  const first = data.syncedFrom ?? start
  const notes: string[] = []
  if (start < first) {
    notes.push(`No data before ${first}; started there.`)
    start = first
  }
  if (end > today && !future) {
    notes.push(`No data after today (${today}); stopped there.`)
    end = today
  }
  if (start > end) return `Error: no data in that range. Data covers ${first} to ${today}.`
  return { start, end, note: notes.join(' ') }
}

function periodSummary(data: Dataset, { start, end }: Range): string {
  const acts = actsIn(data, start, end)
  const ds = dayList(data, start, end)
  const lines = [`Period ${start} to ${end} (${diffDays(start, end) + 1} days).`, `Sessions: ${acts.length}, ${fmtHours(sum(acts.map((a) => a.durationH)))} in total.`]
  for (const s of SPORTS) {
    const xs = acts.filter((a) => a.sport === s)
    if (xs.length) lines.push(`- ${SPORT_LABEL[s]}: ${xs.length} sessions, ${fmtHours(sum(xs.map((a) => a.durationH)))}${sum(nums(xs.map((a) => a.distanceKm))) ? `, ${r1(sum(nums(xs.map((a) => a.distanceKm))))} km` : ''}`)
  }
  const runs = acts.filter((a) => a.sport === 'running' && a.distanceKm && a.paceSecPerKm)
  const km = sum(runs.map((a) => a.distanceKm!))
  if (km) lines.push(`Running: average pace ${fmtPace(sum(runs.map((a) => a.paceSecPerKm! * a.distanceKm!)) / km)} min/km, longest ${r1(Math.max(...runs.map((a) => a.distanceKm!)))} km.`)
  lines.push(
    `Averages: sleep ${avg(ds, (d) => d.sleepH, fmtHours)} (${nums(ds.map((d) => d.sleepH)).length} nights recorded), sleep score ${avg(ds, (d) => d.sleepScore, (v) => String(Math.round(v)))}, HRV ${avg(ds, (d) => d.hrv, (v) => `${Math.round(v)} ms`)}, resting HR ${avg(ds, (d) => d.restingHr, (v) => `${Math.round(v)} bpm`)}, steps ${avg(ds, (d) => d.steps, (v) => String(Math.round(v)))}, stress ${avg(ds, (d) => d.stressAvg, (v) => String(Math.round(v)))}.`,
  )
  const ws = ds.filter((d) => d.weightKg !== null)
  if (ws.length) lines.push(`Weight: ${r1(ws[0].weightKg!)} kg on ${ws[0].date}, ${r1(ws[ws.length - 1].weightKg!)} kg on ${ws[ws.length - 1].date} (${ws.length} weigh-ins).`)
  return lines.join('\n')
}

function listActivities(data: Dataset, { start, end }: Range, sport: unknown): string {
  const want = typeof sport === 'string' && sport !== 'any' && (SPORTS as string[]).includes(sport) ? (sport as Sport) : null
  const acts = actsIn(data, start, end, want ? (a) => a.sport === want : undefined)
  if (!acts.length) return `No ${want ? SPORT_LABEL[want].toLowerCase() + ' ' : ''}sessions between ${start} and ${end}.`
  const shown = acts.slice(0, 40)
  return [`${acts.length} sessions${acts.length > 40 ? ', newest 40 shown' : ''}:`, ...shown.map((a) => `- ${activityLine(a)}`)].join('\n')
}

function dailyHealth(data: Dataset, { start, end }: Range): string {
  const span = diffDays(start, end) + 1
  const row = (label: string, ds: Day[]) =>
    `${label}: sleep ${avg(ds, (d) => d.sleepH, fmtHours)}, score ${avg(ds, (d) => d.sleepScore, (v) => String(Math.round(v)))}, HRV ${avg(ds, (d) => d.hrv, (v) => String(Math.round(v)))}, RHR ${avg(ds, (d) => d.restingHr, (v) => String(Math.round(v)))}, Body Battery wake ${avg(ds, (d) => d.bbWake, (v) => String(Math.round(v)))}, steps ${avg(ds, (d) => d.steps, (v) => String(Math.round(v)))}, stress ${avg(ds, (d) => d.stressAvg, (v) => String(Math.round(v)))}`
  if (span <= 45) return ['Daily values ("not recorded" means the watch logged nothing):', ...dayList(data, start, end).map((d) => `- ${row(d.date, [d])}`)].join('\n')
  const rows: string[] = []
  if (span <= 200) {
    for (let s = mondayOf(start); s <= end; s = addDays(s, 7)) rows.push(`- ${row(`week of ${s}`, dayList(data, s < start ? start : s, addDays(s, 6) < end ? addDays(s, 6) : end))}`)
    return ['Weekly averages:', ...rows].join('\n')
  }
  for (let s = monthStart(start); s <= end; s = addMonths(s, 1)) {
    const e = addDays(addMonths(s, 1), -1)
    rows.push(`- ${row(s.slice(0, 7), dayList(data, s < start ? start : s, e < end ? e : end))}`)
  }
  return ['Monthly averages:', ...rows].join('\n')
}

function strength(data: Dataset, { start, end }: Range): string {
  const acts = actsIn(data, start, end, (a) => a.sport === 'strength')
  if (!acts.length) return `No strength sessions between ${start} and ${end}.`
  const w = muscleWork(acts)
  const top = topExercises(acts, 12)
  return [
    `${acts.length} strength sessions. Identified sets: ${w.placed}; unidentified: ${w.unplaced}.`,
    `Weighted sets per muscle (helpers count half): ${MUSCLES.map((m) => `${MUSCLE_LABEL[m]} ${r1(w.sets[m])}`).join(', ')}.`,
    'Top exercises:',
    ...top.map((e) => `- ${e.name} (mainly ${e.main}): ${e.sessions} sessions, ${e.sets} sets, ${e.reps} reps`),
    'Note: Garmin does not record the weights lifted.',
  ].join('\n')
}

function trainingPlan(data: Dataset, { start, end }: Range, today: string): string {
  const plan = getTrainingPlan()
  if (!plan) return 'No training plan has been set up.'
  const span = diffDays(start, end) + 1
  if (span <= 45) {
    const rows: string[] = []
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const p = plan.days.get(d)
      const did = d <= today ? actsIn(data, d, d).map((a) => `${SPORT_LABEL[a.sport].toLowerCase()} ${fmtHours(a.durationH)}${a.distanceKm ? ` ${r1(a.distanceKm)} km` : ''}`).join(', ') || 'nothing recorded' : null
      rows.push(`- ${fmtWeekday(d)} ${fmtDay(d)} ${d.slice(0, 4)}: plan ${p ? `${describeDay(p)} [week ${p.week}, ${p.phase}]` : 'not in plan'}${did !== null ? `; did ${did}` : ''}`)
    }
    return ['Day by day:', ...rows].join('\n')
  }
  const rows: string[] = []
  for (let w = mondayOf(start); w <= end; w = addDays(w, 7)) {
    const v = weekVsPlan(data, plan, w, today)
    rows.push(`- week starting Mon ${fmtDay(w)} ${w.slice(0, 4)}${v.phase ? ` (${v.phase})` : ''}: running planned ${v.totals.plannedRunMin} min${w <= today ? `, done ${Math.round(v.totals.actualRunMin)} min / ${r1(v.totals.actualRunKm)} km` : ''}; gym planned ${v.totals.plannedGym}${w <= today ? `, done ${v.totals.actualGym}` : ''}`)
  }
  return ['Week by week:', ...rows].join('\n')
}

function weight(data: Dataset, { start, end }: Range): string {
  let ws = dayList(data, start, end).filter((d) => d.weightKg !== null)
  if (!ws.length) return `No weigh-ins between ${start} and ${end}.`
  const monthly = ws.length > 40
  if (monthly) ws = ws.filter((d, i) => i === ws.length - 1 || ws[i + 1].date.slice(0, 7) !== d.date.slice(0, 7))
  return [
    monthly ? 'Last weigh-in of each month:' : 'Weigh-ins:',
    ...ws.map((d) => `- ${d.date}: ${r1(d.weightKg!)} kg${d.bodyFatPct !== null ? `, body fat ${r1(d.bodyFatPct)}%` : ''}${d.muscleKg !== null ? `, muscle ${r1(d.muscleKg)} kg` : ''}`),
  ].join('\n')
}

export type Turn = { role: 'user' | 'assistant'; content: string }
export type Lookup = { tool: string; label: string }
export type AskResult = { answer: string; lookups: Lookup[]; model: string; ms: number }

const LABEL: Record<string, string> = {
  get_period_summary: 'Summary',
  list_activities: 'Activities',
  get_daily_health: 'Daily health',
  get_strength: 'Strength',
  get_weight: 'Weight',
  get_training_plan: 'Training plan',
}

function runTool(name: string, args: Record<string, unknown>, data: Dataset, today: string): { text: string; label: string } {
  const r = range(args, data, today, name === 'get_training_plan')
  if (typeof r === 'string') return { text: r, label: `${LABEL[name] ?? name} (invalid dates)` }
  const label = `${LABEL[name] ?? name}, ${fmtDay(r.start)} ${r.start.slice(0, 4)} – ${fmtDay(r.end)} ${r.end.slice(0, 4)}${name === 'list_activities' && typeof args.sport === 'string' && args.sport !== 'any' ? ` (${args.sport})` : ''}`
  const body =
    name === 'get_period_summary' ? periodSummary(data, r)
      : name === 'list_activities' ? listActivities(data, r, args.sport)
        : name === 'get_daily_health' ? dailyHealth(data, r)
          : name === 'get_strength' ? strength(data, r)
            : name === 'get_weight' ? weight(data, r)
              : name === 'get_training_plan' ? trainingPlan(data, r, today)
              : `Error: there is no tool called ${name}.`
  return { text: r.note ? `${r.note}\n${body}` : body, label }
}

export async function askCoach(data: Dataset, question: string, history: Turn[]): Promise<AskResult> {
  const today = todayFn()
  const ai = getProvider()
  const PROFILE = getProfile()
  const system = `You answer questions about one person's training and health, using their Garmin history on their own Mac.
Today is ${today}. Data covers ${data.syncedFrom ?? 'unknown'} to ${today}. Their goals: ${PROFILE.goals.join('; ')}. Equipment: ${PROFILE.equipment.join('; ')}. Limitations: ${PROFILE.limitations.join(' | ')}.
- Look things up with the tools before answering anything about their data. Never guess or invent figures. You may call several tools.
- For "this year", "last month", "next week" and similar, work out the exact dates from today's date.
- For anything about their plan (what's planned, whether they're on track), use get_training_plan.
- Answer briefly: 1 to 3 short paragraphs or a short list. Quote the figures you used, with their dates.
- If the data doesn't cover the question, say so plainly.
- British English, metric units, pace as m:ss min/km, dates like 3 Nov 2025.
- Coaching, not medical advice.`
  const messages: AiMessage[] = [{ role: 'system', content: system }, ...history.slice(-6), { role: 'user', content: question }]
  const lookups: Lookup[] = []
  let ms = 0
  for (let step = 0; step <= MAX_STEPS; step++) {
    const res = await ai.chat({ messages, tools: step < MAX_STEPS ? TOOLS : undefined })
    ms += res.ms
    if (!res.toolCalls.length) {
      const answer = res.content.trim()
      if (!answer) throw new AiError('The model returned an empty answer. Try rephrasing the question.')
      return { answer, lookups, model: ai.label, ms }
    }
    messages.push({ role: 'assistant', content: res.content, toolCalls: res.toolCalls })
    for (const call of res.toolCalls) {
      const out = runTool(call.name, call.arguments, data, today)
      lookups.push({ tool: call.name, label: out.label })
      messages.push({ role: 'tool', name: call.name, content: out.text })
    }
  }
  throw new AiError('The model kept looking things up without answering. Try a narrower question.')
}
