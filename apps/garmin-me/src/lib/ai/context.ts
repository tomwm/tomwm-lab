/**
 * Plain-text briefs of your data for the coach. Every figure here is
 * calculated by the app from Garmin data; the model only reads it. Keeping
 * the maths out of the model is what makes a small local model reliable.
 */
import 'server-only'
import type { Dataset } from '../data'
import { addDays, addMonths, diffDays, fmtDay, fmtWeekday, monthStart, mondayOf } from '../dates'
import { fmtHours, fmtOne, fmtPace } from '../format'
import { SPORT_LABEL, type Activity, type Day } from '../garmin/normalize'
import { actsIn, dayList, mean, nums, sum } from '../metrics'
import { MUSCLE_LABEL, MUSCLES, muscleWork, targetOf } from '../muscles'
import { getStrengthPlan, planText, planWeek, WEEKDAY } from '../plan'
import { describeDay, getTrainingPlan, hrZonesText, runHistory, weekVsPlan, type TrainingPlan } from '../trainingPlan'
import { getProfile } from './profile'

const r0 = (v: number) => String(Math.round(v))
const r1 = (v: number) => fmtOne(v).replace(',', '')
const avgOf = (days: Day[], pick: (d: Day) => number | null) => mean(nums(days.map(pick)))
const fmtAvg = (v: number | null, f: (v: number) => string, unit = '') => (v === null ? 'not recorded' : `${f(v)}${unit}`)
/** "12% below" / "about the same as" / "8% above": spelled out so the model never has to compare numbers itself. */
function versus(v: number | null, base: number | null): string {
  if (v === null || base === null || base === 0) return ''
  const pct = Math.round(((v - base) / base) * 100)
  if (Math.abs(pct) < 5) return ' (about the same as average)'
  return ` (${Math.abs(pct)}% ${pct < 0 ? 'below' : 'above'} average)`
}
const dayName = (d: string) => `${fmtWeekday(d)} ${fmtDay(d)} ${d.slice(0, 4)}`

/** One line per session. */
export function activityLine(a: Activity): string {
  const parts = [dayName(a.date), SPORT_LABEL[a.sport], `"${a.name}"`, fmtHours(a.durationH)]
  if (a.distanceKm !== null) parts.push(`${r1(a.distanceKm)} km`)
  if (a.paceSecPerKm !== null && (a.sport === 'running' || a.sport === 'walking')) parts.push(`${fmtPace(a.paceSecPerKm)} min/km`)
  if (a.avgHr !== null) parts.push(`avg HR ${r0(a.avgHr)}`)
  if (a.trainingLoad !== null) parts.push(`load ${r0(a.trainingLoad)}`)
  const ex = a.exercises.filter((e) => targetOf(e) && e.sets > 0)
  if (ex.length) parts.push(`exercises: ${ex.map((e) => `${(e.sub ?? e.category).replace(/_/g, ' ').toLowerCase()} ${e.sets}x${e.reps ? Math.round(e.reps / Math.max(1, e.sets)) : '?'}`).join(', ')}`)
  return parts.join(' | ')
}

const LEGS = new Set(['quads', 'hamstrings', 'glutes', 'calves'])
const worksLegs = (a: Activity) => a.exercises.some((e) => targetOf(e)?.main.some((m) => LEGS.has(m)))

function daysSince(data: Dataset, today: string, test: (a: Activity) => boolean): string {
  const a = data.activities.find((x) => x.date <= today && test(x)) // newest first
  return a ? `${diffDays(a.date, today)} days (${fmtDay(a.date)})` : 'none on record'
}

function weightLine(data: Dataset, today: string): string {
  const ws = dayList(data, addDays(today, -365), today).filter((d) => d.weightKg !== null)
  if (!ws.length) return 'WEIGHT: no weigh-ins in the last year.'
  const last = ws[ws.length - 1]
  const near = (back: number) => {
    const target = addDays(today, -back)
    return ws.reduce((b, d) => (Math.abs(diffDays(d.date, target)) < Math.abs(diffDays(b.date, target)) ? d : b), ws[0])
  }
  const m1 = near(30)
  const m3 = near(90)
  const delta = (a: number, b: number) => `${a - b >= 0 ? '+' : ''}${r1(a - b)}`
  const out = [`WEIGHT: latest ${r1(last.weightKg!)} kg on ${fmtDay(last.date)}`]
  if (m1.date !== last.date) out.push(`${delta(last.weightKg!, m1.weightKg!)} kg since ${fmtDay(m1.date)}`)
  if (m3.date !== last.date && m3.date !== m1.date) out.push(`${delta(last.weightKg!, m3.weightKg!)} kg since ${fmtDay(m3.date)}`)
  if (last.bodyFatPct !== null) out.push(`body fat ${r1(last.bodyFatPct)}%`)
  out.push(`${ws.length} weigh-ins in the last year`)
  return out.join('; ') + '.'
}

function runningWeeks(data: Dataset, today: string, weeks: number): string {
  const thisMon = mondayOf(today)
  const rows: string[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const s = addDays(thisMon, -7 * i)
    const runs = actsIn(data, s, addDays(s, 6), (a) => a.sport === 'running')
    rows.push(`w/c ${fmtDay(s)}: ${r1(sum(nums(runs.map((a) => a.distanceKm))))} km${i === 0 ? ' (this week so far)' : ''}`)
  }
  return rows.join('; ')
}

function header(data: Dataset, today: string): string[] {
  const p = getProfile()
  const race = p.marathon ? ` About ${Math.round(diffDays(today, p.marathon) / 7)} weeks until race day (${fmtDay(p.marathon)} ${p.marathon.slice(0, 4)}).` : ''
  return [
    `ATHLETE GOALS: ${p.goals.join('; ')}.${race}`,
    ...(p.equipment.length ? [`EQUIPMENT: ${p.equipment.join('; ')}.`] : []),
    ...(p.limitations.length ? [`LIMITATIONS (always respect): ${p.limitations.join(' | ')}.`] : []),
    ...(p.benchmarks.length ? [`HISTORICAL BESTS (context only, never prescribe weights from them): ${p.benchmarks.join('; ')}.`] : []),
    `TODAY: ${dayName(today)}. History available from ${data.syncedFrom ? fmtDay(data.syncedFrom) + ' ' + data.syncedFrom.slice(0, 4) : 'unknown'}.`,
  ]
}

/** The plan, and this week's progress against it (matching is the app's best guess). */
function planSection(data: Dataset, today: string): string[] {
  const PLAN = getStrengthPlan()
  if (!PLAN.length) return []
  const w = planWeek(data, today)
  const status = w.sessions.map((s) =>
    s.done ? `${s.session.name} done ${fmtWeekday(s.done.date)} ${fmtDay(s.done.date)}${s.done.how === 'order' ? ' (probably: exercises not recorded)' : ''}` : `${s.session.name} not done`,
  )
  const { weeklyKm, longRunKm } = getProfile().higherVolumeRunning
  const runs28 = actsIn(data, addDays(today, -27), today, (a) => a.sport === 'running')
  const avgKm = sum(nums(runs28.map((a) => a.distanceKm))) / 4
  const longest14 = Math.max(0, ...nums(actsIn(data, addDays(today, -13), today, (a) => a.sport === 'running').map((a) => a.distanceKm)))
  const heavy = avgKm >= weeklyKm || longest14 >= longRunKm
  const scheduled = !!getTrainingPlan()
  return [
    `STRENGTH PLAN (${PLAN.length} sessions most weeks; days can move):`,
    ...PLAN.map((s) => `- ${planText(s)}`),
    scheduled
      ? 'The day-by-day training plan below says which strength session falls on which day; follow it rather than the usual days.'
      : heavy
      ? `RUNNING PHASE: higher volume (average ${r1(avgKm)} km/week over 4 weeks; longest run in 14 days ${r1(longest14)} km). The plan's running-heavy options apply: ${PLAN.filter((x) => x.optional).map((x) => `${x.name}: ${x.optional}`).join('; ') || 'none listed'}.`
      : `RUNNING PHASE: not high volume (average ${r1(avgKm)} km/week over 4 weeks; longest run in 14 days ${r1(longest14)} km). Keep every plan session at full volume.`,
    `THIS WEEK (from Mon ${fmtDay(w.weekStart)}): ${status.join('; ')}${w.extra.length ? `; plus ${w.extra.length} other strength session(s)` : ''}. Next due in plan order: ${w.next ? w.next.name : 'none, all done'}.${scheduled ? '' : ` Today is the usual day for: ${PLAN.filter((s) => s.day === ((new Date(today + 'T12:00:00').getDay() + 6) % 7) + 1).map((s) => s.name).join(', ') || 'no plan session'} (${WEEKDAY[((new Date(today + 'T12:00:00').getDay() + 6) % 7) + 1]}).`}`,
  ]
}

const dayLine = (d: string) => `${fmtWeekday(d)} ${fmtDay(d)}`
const mins = (m: number) => `${Math.round(m)} min`

/** The day-by-day training plan around today, and how this week is going against it. */
function trainingPlanSection(data: Dataset, today: string, plan: TrainingPlan): string[] {
  const p = getProfile()
  const t = plan.days.get(today)
  const w = weekVsPlan(data, plan, today, today)
  const out: string[] = []
  const totalWeeks = plan.weeks.length || Math.max(...[...plan.days.values()].map((d) => d.week))
  out.push(
    `TRAINING PLAN${p.raceName ? ` for ${p.raceName}` : ''}${p.marathon ? ` on ${fmtDay(p.marathon)} ${p.marathon.slice(0, 4)}` : ''}: ${t ? `week ${t.week} of ${totalWeeks}, phase "${t.phase}"` : 'today is outside the plan dates'}. A rough guide: don't double up missed sessions.`,
  )
  if (plan.overview.length) out.push(`PLAN RULES AND NOTES: ${plan.overview.join(' | ')}.`)
  const zones = hrZonesText()
  if (zones) out.push(`HEART RATE ZONES: ${zones}.`)
  if (w.week) out.push(`THIS WEEK'S PLAN NOTE: ${[w.week.runNote, w.week.crossNote].filter(Boolean).join('; ')}.`)
  out.push(`TODAY'S PLAN (${dayLine(today)}): ${t ? describeDay(t) : 'not in plan'}.`)
  const tm = plan.days.get(addDays(today, 1))
  out.push(`TOMORROW'S PLAN (${dayLine(addDays(today, 1))}): ${tm ? describeDay(tm) : 'not in plan'}.`)
  out.push(`THIS WEEK SO FAR vs PLAN (from Mon ${fmtDay(w.weekStart)}):`)
  for (const d of w.days.filter((x) => x.date < today)) {
    const planned = d.items.length ? d.items.map((i) => `${i.label} ${i.minutes} min ${i.done ? (i.doneOn ? `done on ${fmtWeekday(i.doneOn)}` : 'done') : i.optional ? 'not done (optional)' : 'missed'}`).join(', ') : 'rest'
    const did = d.actual.length ? d.actual.map((a) => `${SPORT_LABEL[a.sport].toLowerCase()} ${mins(a.durationH * 60)}${a.distanceKm ? ` ${r1(a.distanceKm)} km` : ''}${d.strengthMatch[a.id] ? ` (${d.strengthMatch[a.id]})` : ''}`).join(', ') : 'nothing recorded'
    out.push(`- ${dayLine(d.date)}: planned ${planned}; did ${did}`)
  }
  const tt = w.totals
  out.push(
    `WEEK TOTALS: running ${mins(tt.actualRunMin)} (${r1(tt.actualRunKm)} km) done of ${mins(tt.plannedRunMin)} planned for the week (${mins(tt.plannedRunMinToDate)} planned up to today); gym ${tt.actualGym} of ${tt.plannedGym}; cross-training ${mins(tt.actualCrossMin)} of ${mins(tt.plannedCrossMin)}.`,
  )
  return out
}

/** Plan sessions done in each of the last few weeks. */
function planHistory(data: Dataset, today: string, weeks: number): string {
  const total = getStrengthPlan().length
  if (!total) return 'STRENGTH PLAN: none set.'
  const rows: string[] = []
  for (let i = weeks; i >= 1; i--) {
    const w = planWeek(data, addDays(mondayOf(today), -7 * i))
    rows.push(`w/c ${fmtDay(w.weekStart)}: ${w.sessions.filter((s) => s.done).length}/${total} (${w.sessions.filter((s) => !s.done).map((s) => s.session.name).join(', ') || 'none'} missed)`)
  }
  return `PLAN ADHERENCE, last ${weeks} full weeks (best-guess matching): ${rows.join('; ')}.`
}

function recovery(data: Dataset, today: string): string {
  const d = data.days.get(today)
  const prev = dayList(data, addDays(today, -30), addDays(today, -1))
  const sleepAvg = avgOf(prev, (x) => x.sleepH)
  const hrvAvg = avgOf(prev, (x) => x.hrv)
  const rhrAvg = avgOf(prev, (x) => x.restingHr)
  const bits = [
    `sleep ${d?.sleepH != null ? fmtHours(d.sleepH) : 'not recorded'}${d?.sleepScore != null ? ` (score ${d.sleepScore})` : ''}, 30-day average ${fmtAvg(sleepAvg, fmtHours)}${versus(d?.sleepH ?? null, sleepAvg)}`,
    `overnight HRV ${d?.hrv != null ? `${r0(d.hrv)} ms` : 'not recorded'}, 30-day average ${fmtAvg(hrvAvg, r0, ' ms')}${versus(d?.hrv ?? null, hrvAvg)}${d?.hrvStatus && d.hrvStatus !== 'NONE' ? `, Garmin status ${d.hrvStatus.toLowerCase()}` : ''}`,
    `resting HR ${d?.restingHr != null ? `${r0(d.restingHr)} bpm` : 'not recorded'}, 30-day average ${fmtAvg(rhrAvg, r0, ' bpm')}${versus(d?.restingHr ?? null, rhrAvg)}`,
    `Body Battery at wake ${d?.bbWake != null ? r0(d.bbWake) : 'not recorded'}`,
  ]
  return `RECOVERY THIS MORNING: ${bits.join('; ')}.`
}

function load(data: Dataset, today: string): string {
  const l7 = sum(nums(actsIn(data, addDays(today, -6), today).map((a) => a.trainingLoad)))
  const l28 = sum(nums(actsIn(data, addDays(today, -27), today).map((a) => a.trainingLoad)))
  return `TRAINING LOAD (sum of Garmin per-session load, calculated): last 7 days ${r0(l7)}; weekly average over last 28 days ${r0(l28 / 4)}${versus(l7, l28 / 4).replace('average', 'that average')}.`
}

function muscles(data: Dataset, today: string, days: number): string {
  const w = muscleWork(actsIn(data, addDays(today, -(days - 1)), today, (a) => a.sport === 'strength'))
  if (!w.placed) return `MUSCLES WORKED, last ${days} days: no identified strength exercises.`
  return `MUSCLES WORKED, last ${days} days (weighted sets; helpers count half): ${MUSCLES.map((m) => `${MUSCLE_LABEL[m].toLowerCase()} ${r1(w.sets[m]).replace(/\.0$/, '')}`).join(', ')}.`
}

/** What the coach reads to suggest today's session. */
export function workoutBrief(data: Dataset, today: string): string {
  const plan = getTrainingPlan()
  const recent = actsIn(data, addDays(today, -13), today).sort((a, b) => (a.startLocal < b.startLocal ? -1 : 1))
  const runs28 = actsIn(data, addDays(today, -27), today, (a) => a.sport === 'running')
  const longest = Math.max(0, ...nums(runs28.map((a) => a.distanceKm)))
  const paceKm = sum(nums(runs28.map((a) => a.distanceKm)))
  const paceSec = paceKm ? sum(runs28.filter((a) => a.distanceKm && a.paceSecPerKm).map((a) => a.paceSecPerKm! * a.distanceKm!)) / paceKm : null
  return [
    ...header(data, today),
    recovery(data, today),
    `SESSIONS IN THE LAST 14 DAYS (${recent.length}):`,
    ...(recent.length ? recent.map((a) => `- ${activityLine(a)}`) : ['- none']),
    ...planSection(data, today),
    ...(plan ? trainingPlanSection(data, today, plan) : []),
    `DAYS SINCE: last run ${daysSince(data, today, (a) => a.sport === 'running')}; last strength ${daysSince(data, today, (a) => a.sport === 'strength')}; last leg exercises ${daysSince(data, today, worksLegs)}.`,
    `RUNNING, last 28 days: ${runs28.length} runs, ${r1(paceKm)} km, longest ${r1(longest)} km, average pace ${paceSec ? fmtPace(paceSec) + ' min/km' : 'n/a'}. Weekly km: ${runningWeeks(data, today, 4)}.`,
    load(data, today),
    muscles(data, today, 14),
    weightLine(data, today),
  ].join('\n')
}

function insightsPlan(data: Dataset, today: string): string[] {
  const plan = getTrainingPlan()
  if (!plan) return []
  const t = plan.days.get(today)
  const rows = runHistory(data, plan, today, 4).map(
    (w) => `w/c ${fmtDay(w.weekStart)}: running ${w.actualMin} of ${w.plannedMin} planned min (${r1(w.actualKm)} km), gym ${w.gymDone} of ${w.gymPlanned}`,
  )
  const cur = weekVsPlan(data, plan, today, today).totals
  return [
    `TRAINING PLAN: ${t ? `week ${t.week}, phase "${t.phase}"` : 'outside plan dates'}. Plan vs done, last full weeks: ${rows.join('; ') || 'none yet'}. This week so far: running ${mins(cur.actualRunMin)} of ${mins(cur.plannedRunMinToDate)} planned to date, gym ${cur.actualGym} of ${cur.plannedGym}.`,
  ]
}

/** What the coach reads for insights: recent weeks against the weeks before, plus longer trends. */
export function insightsBrief(data: Dataset, today: string): string {
  const cur = dayList(data, addDays(today, -29), today)
  const prev = dayList(data, addDays(today, -59), addDays(today, -30))
  const per = (days: Day[], acts: Activity[]) => {
    const runs = acts.filter((a) => a.sport === 'running')
    const str = acts.filter((a) => a.sport === 'strength')
    return [
      `${acts.length} sessions, ${fmtHours(sum(acts.map((a) => a.durationH)))} active`,
      `${runs.length} runs, ${r1(sum(nums(runs.map((a) => a.distanceKm))))} km`,
      `${str.length} strength sessions`,
      `avg sleep ${fmtAvg(avgOf(days, (d) => d.sleepH), fmtHours)} (${nums(days.map((d) => d.sleepH)).length} nights recorded)`,
      `avg sleep score ${fmtAvg(avgOf(days, (d) => d.sleepScore), r0)}`,
      `avg HRV ${fmtAvg(avgOf(days, (d) => d.hrv), r0, ' ms')}`,
      `avg resting HR ${fmtAvg(avgOf(days, (d) => d.restingHr), r0, ' bpm')}`,
      `avg steps ${fmtAvg(avgOf(days, (d) => d.steps), r0)}`,
      `avg stress ${fmtAvg(avgOf(days, (d) => d.stressAvg), r0)}`,
    ].join('; ')
  }
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const s = addMonths(monthStart(today), -i)
    const e = addDays(addMonths(s, 1), -1) < today ? addDays(addMonths(s, 1), -1) : today
    const ds = dayList(data, s, e)
    const acts = actsIn(data, s, e)
    const w = ds.filter((d) => d.weightKg !== null)
    months.push(
      `${fmtDay(s).split(' ')[1]} ${s.slice(0, 4)}: ${acts.length} sessions, ${r1(sum(nums(acts.filter((a) => a.sport === 'running').map((a) => a.distanceKm))))} km run, resting HR ${fmtAvg(avgOf(ds, (d) => d.restingHr), r0)}, HRV ${fmtAvg(avgOf(ds, (d) => d.hrv), r0)}, sleep ${fmtAvg(avgOf(ds, (d) => d.sleepH), fmtHours)}, weight ${w.length ? r1(w[w.length - 1].weightKg!) + ' kg' : 'no weigh-in'}`,
    )
  }
  return [
    ...header(data, today),
    `LAST 30 DAYS (${fmtDay(addDays(today, -29))} to ${fmtDay(today)}): ${per(cur, actsIn(data, addDays(today, -29), today))}.`,
    `PREVIOUS 30 DAYS (${fmtDay(addDays(today, -59))} to ${fmtDay(addDays(today, -30))}): ${per(prev, actsIn(data, addDays(today, -59), addDays(today, -30)))}.`,
    `MONTH BY MONTH:`,
    ...months.map((m) => `- ${m}`),
    `RUNNING WEEKLY KM, last 8 weeks: ${runningWeeks(data, today, 8)}.`,
    planHistory(data, today, 4),
    ...insightsPlan(data, today),
    load(data, today),
    muscles(data, today, 30),
    weightLine(data, today),
  ].join('\n')
}
