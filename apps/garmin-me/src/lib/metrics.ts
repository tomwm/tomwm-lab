/**
 * Locally calculated aggregates: period windows, buckets, means, sums and
 * period-over-period comparisons. Nothing here calls Garmin. Anything built
 * from these helpers is a plain total, average or comparison of Garmin's data.
 * Figures Garmin doesn't report at all (pace averages, weighted minutes,
 * projections) are marked as estimates in the UI.
 */
import {
  addDays, addMonths, diffDays, eachDay, fmtDay, fmtFull, fmtMonth, fmtMonthLong, fmtWeekday, mondayOf, monthStart, today,
} from './dates'
import type { Dataset } from './data'
import { emptyDay, type Activity, type Day } from './garmin/normalize'

/**
 * Rolling ranges, a calendar year ('y2024'), a calendar month ('m2025-11'),
 * a Monday-to-Sunday week ('w2025-11-03'), everything loaded ('all'), or a
 * single day ('d2025-11-04', used by the Days page).
 */
export type RangeKey = '7d' | '30d' | '12w' | '12m' | 'all' | `y${number}` | `m${string}` | `w${string}` | `d${string}`
export const RANGES: { key: RangeKey; label: string; short: string; adj: string }[] = [
  { key: '7d', label: '7 days', short: '7D', adj: '7-day' },
  { key: '30d', label: '30 days', short: '30D', adj: '30-day' },
  { key: '12w', label: '12 weeks', short: '12W', adj: '12-week' },
  { key: '12m', label: '12 months', short: '12M', adj: '12-month' },
]
export function parseRange(v: unknown): RangeKey {
  if (typeof v !== 'string') return '30d'
  if (v === 'all' || RANGES.some((r) => r.key === v)) return v as RangeKey
  const now = today()
  const y = /^y(\d{4})$/.exec(v)
  if (y && +y[1] >= 2000 && +y[1] <= +now.slice(0, 4)) return v as RangeKey
  const m = /^m(\d{4}-\d{2})$/.exec(v)
  if (m && +m[1].slice(5) >= 1 && +m[1].slice(5) <= 12 && `${m[1]}-01` <= now) return `m${m[1]}`
  const w = /^w(\d{4}-\d{2}-\d{2})$/.exec(v)
  if (w && !Number.isNaN(Date.parse(w[1])) && w[1] <= now) return `w${mondayOf(w[1])}`
  return '30d'
}

/** Where a click on a bucket goes: a day opens the Days page; a week, month or year narrows the current page. */
export const dayHref = (d: string) => `/day?date=${d}`
export const weekHref = (monday: string) => `?range=w${monday}`
export const monthHref = (first: string) => `?range=m${first.slice(0, 7)}`

export type Bucket = { label: string; full: string; start: string; end: string; go: string }
export type Period = {
  range: RangeKey
  /** 'last 30 days', '2024', 'all time': reads naturally after "in" or as a heading. */
  title: string
  /** '30-day', '2024', 'all-time', for "vs 30-day average". */
  adj: string
  /** 'previous 30 days', '2023': what comparisons are made against. */
  prevLabel: string
  start: string
  end: string
  prevStart: string
  prevEnd: string
  /** Buckets for volume bars: days, weeks, months or years depending on the range. */
  buckets: Bucket[]
  bucketNoun: 'day' | 'week' | 'month' | 'year'
  /** How daily metrics are plotted: every day, or weekly / monthly averages on long ranges. */
  trendUnit: 'day' | 'week' | 'month'
  /** True when trends are averages rather than single days. */
  weeklyTrend: boolean
  /** 'Weekly average' / 'Monthly average' ('' on daily ranges). */
  avgLabel: string
  /** 'Weekly' / 'Monthly' / 'Daily'. */
  avgWord: string
  /** For a single week or month: the ranges either side, for stepping. */
  step?: { prev: RangeKey; next: RangeKey | null; label: string }
}

const monthBuckets = (first: string, count: number, end: string): Bucket[] =>
  Array.from({ length: count }, (_, i) => {
    const s = addMonths(first, i)
    const last = addDays(addMonths(s, 1), -1)
    const e = last < end ? last : end
    return { label: fmtMonth(s), full: `${fmtMonth(s)} ${s.slice(0, 4)}${e === end && e !== last ? ' (so far)' : ''}`, start: s, end: e, go: monthHref(s) }
  }).filter((b) => b.start <= end)

const dayBuckets = (start: string, end: string, label: (d: string) => string): Bucket[] =>
  eachDay(start, end).map((d) => ({ label: label(d), full: fmtFull(d), start: d, end: d, go: dayHref(d) }))

/**
 * @param dataStart earliest date loaded from Garmin; "all time" starts there.
 */
export function makePeriod(range: RangeKey, end = today(), dataStart: string | null = null): Period {
  const now = end
  const preset = RANGES.find((r) => r.key === range)
  let start: string
  let buckets: Bucket[]
  let bucketNoun: Period['bucketNoun']
  let trendUnit: Period['trendUnit'] = 'day'
  let title = preset ? `last ${preset.label}` : ''
  let adj = preset?.adj ?? ''
  let prevLabel = preset ? `previous ${preset.label}` : ''
  let prev: { start: string; end: string } | null = null
  let step: Period['step']

  if (range === '7d' || range === '30d') {
    start = addDays(end, range === '7d' ? -6 : -29)
    bucketNoun = 'day'
    buckets = dayBuckets(start, end, range === '7d' ? fmtWeekday : fmtDay)
  } else if (range === '12w') {
    start = addDays(mondayOf(end), -77)
    bucketNoun = 'week'
    buckets = Array.from({ length: 12 }, (_, i) => {
      const s = addDays(start, i * 7)
      const e = addDays(s, 6) < end ? addDays(s, 6) : end
      return { label: fmtDay(s), full: `Week of ${fmtDay(s)}${e === end && diffDays(s, e) < 6 ? ' (so far)' : ''}`, start: s, end: e, go: weekHref(s) }
    })
  } else if (range === '12m') {
    start = addMonths(monthStart(end), -11)
    bucketNoun = 'month'
    trendUnit = 'week'
    buckets = monthBuckets(start, 12, end)
  } else if (range === 'all') {
    start = dataStart && dataStart < end ? dataStart : addMonths(monthStart(end), -11)
    bucketNoun = 'year'
    trendUnit = 'month'
    title = 'all time'
    adj = 'all-time'
    buckets = []
    for (let y = +start.slice(0, 4); y <= +end.slice(0, 4); y++) {
      const s = `${y}-01-01` < start ? start : `${y}-01-01`
      const e = `${y}-12-31` > end ? end : `${y}-12-31`
      const part = s !== `${y}-01-01` ? ` (from ${fmtDay(s)})` : e !== `${y}-12-31` ? ' (so far)' : ''
      buckets.push({ label: String(y), full: `${y}${part}`, start: s, end: e, go: `?range=y${y}` })
    }
    // Nothing earlier to compare with.
    prev = { start: addDays(start, -1), end: addDays(start, -1) }
    prevLabel = ''
  } else if (range.startsWith('w')) {
    // One Monday-to-Sunday week, compared with the week before.
    start = range.slice(1)
    const last = addDays(start, 6)
    end = last < now ? last : now
    bucketNoun = 'day'
    buckets = dayBuckets(start, end, (d) => `${fmtWeekday(d)} ${+d.slice(8)}`)
    title = `week of ${fmtDay(start)} ${start.slice(0, 4)}${end !== last ? ' (so far)' : ''}`
    adj = 'weekly'
    prev = { start: addDays(start, -7), end: addDays(end, -7) }
    prevLabel = 'previous week'
    const next = addDays(start, 7)
    step = { prev: `w${addDays(start, -7)}`, next: next <= now ? `w${next}` : null, label: `Week of ${fmtDay(start)}` }
  } else if (range.startsWith('m')) {
    // One calendar month, compared with the month before.
    start = `${range.slice(1)}-01`
    const last = addDays(addMonths(start, 1), -1)
    end = last < now ? last : now
    bucketNoun = 'day'
    buckets = dayBuckets(start, end, fmtDay)
    const name = `${fmtMonthLong(start)} ${start.slice(0, 4)}`
    title = `${name}${end !== last ? ' so far' : ''}`
    adj = 'monthly'
    const prevStart = addMonths(start, -1)
    const prevLast = addDays(start, -1)
    const span = diffDays(start, end)
    prev = { start: prevStart, end: end !== last && addDays(prevStart, span) < prevLast ? addDays(prevStart, span) : prevLast }
    prevLabel = end !== last ? `same dates in ${fmtMonthLong(prevStart)}` : `${fmtMonthLong(prevStart)} ${prevStart.slice(0, 4)}`
    const next = addMonths(start, 1)
    step = { prev: `m${prevStart.slice(0, 7)}`, next: next <= now ? `m${next.slice(0, 7)}` : null, label: name }
  } else if (range.startsWith('d')) {
    // A single day (the Days page).
    start = end = range.slice(1)
    bucketNoun = 'day'
    buckets = dayBuckets(start, end, fmtDay)
    title = fmtFull(start)
    adj = 'daily'
    prevLabel = 'previous day'
  } else {
    // A calendar year.
    const y = +range.slice(1)
    start = `${y}-01-01`
    const last = `${y}-12-31`
    const thisYear = last >= end
    end = thisYear ? end : last
    bucketNoun = 'month'
    trendUnit = 'week'
    title = thisYear ? `${y} so far` : String(y)
    adj = String(y)
    buckets = monthBuckets(start, 12, end)
    // Compare with the same stretch of the year before.
    prev = { start: `${y - 1}-01-01`, end: thisYear ? `${y - 1}${end.slice(4)}` : `${y - 1}-12-31` }
    prevLabel = thisYear ? `same dates in ${y - 1}` : String(y - 1)
  }

  if (!prev) {
    const len = diffDays(start, end) + 1
    const prevEnd = addDays(start, -1)
    prev = { start: addDays(prevEnd, -(len - 1)), end: prevEnd }
  }
  return {
    range,
    title,
    adj,
    prevLabel,
    start,
    end,
    prevStart: prev.start,
    prevEnd: prev.end,
    buckets,
    bucketNoun,
    trendUnit,
    weeklyTrend: trendUnit !== 'day',
    avgLabel: trendUnit === 'week' ? 'Weekly average' : trendUnit === 'month' ? 'Monthly average' : '',
    avgWord: trendUnit === 'week' ? 'Weekly' : trendUnit === 'month' ? 'Monthly' : 'Daily',
    step,
  }
}

// ---------------------------------------------------------------- basics

export const nums = (xs: (number | null | undefined)[]) => xs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
export const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : null)

/** Continuous list of days; days with no cached record come back all-null. */
export function dayList(data: Dataset, start: string, end: string): Day[] {
  return eachDay(start, end).map((d) => data.days.get(d) ?? emptyDay(d))
}

export const actsIn = (data: Dataset, start: string, end: string, filter?: (a: Activity) => boolean) =>
  data.activities.filter((a) => a.date >= start && a.date <= end && (!filter || filter(a)))

/** Most recent day (on or before `end`) with a value, looking back `maxBack` days. */
export function latest(data: Dataset, pick: (d: Day) => number | null, end = today(), maxBack = 60) {
  for (let i = 0; i <= maxBack; i++) {
    const date = addDays(end, -i)
    const d = data.days.get(date)
    const v = d ? pick(d) : null
    if (d && v !== null) return { date, day: d, value: v }
  }
  return null
}

// ---------------------------------------------------------------- comparisons

export type Delta = { dir: 'up' | 'down' | 'flat'; tone: 'good' | 'bad' | 'neutral'; text: string }

/** History for the previous period has been requested from Garmin. */
export const canCompare = (p: Period, data: Dataset) => p.prevLabel !== '' && !!data.syncedFrom && data.syncedFrom <= p.prevStart

export function makeDelta(
  cur: number | null,
  prev: number | null,
  fmtDiff: (abs: number) => string,
  higherIsBetter: boolean | null,
  vs: string,
  flatBelow = 0,
): Delta | null {
  if (cur === null || prev === null) return null
  const diff = cur - prev
  if (Math.abs(diff) <= flatBelow) return { dir: 'flat', tone: 'neutral', text: `No change ${vs}` }
  const up = diff > 0
  const tone = higherIsBetter === null ? 'neutral' : up === higherIsBetter ? 'good' : 'bad'
  return { dir: up ? 'up' : 'down', tone, text: `${fmtDiff(Math.abs(diff))} ${vs}` }
}

export type Stat = { value: number | null; n: number; delta: Delta | null; spark: (number | null)[] }

type StatOpts = { fmtDiff: (abs: number) => string; higherIsBetter: boolean | null; flatBelow?: number }

/** Mean of a daily metric over the period, vs the mean over the previous period. */
export function dayStat(p: Period, data: Dataset, pick: (d: Day) => number | null, o: StatOpts, opts?: { excludeToday?: boolean }): Stat {
  const end = opts?.excludeToday && p.end === today() ? addDays(p.end, -1) : p.end
  const cur = nums(dayList(data, p.start, end).map(pick))
  const prev = nums(dayList(data, p.prevStart, p.prevEnd).map(pick))
  const m = mean(cur)
  const ok = canCompare(p, data) && prev.length >= Math.max(2, cur.length / 2)
  return {
    value: m,
    n: cur.length,
    delta: ok ? makeDelta(m, mean(prev), o.fmtDiff, o.higherIsBetter, `vs ${p.prevLabel}`, o.flatBelow) : null,
    spark: trendRows(p, data, { v: pick }).map((r) => r.v as number | null),
  }
}

/** Aggregate over activities in the period, vs the previous period. */
export function actStat(
  p: Period,
  data: Dataset,
  filter: ((a: Activity) => boolean) | undefined,
  valueOf: (a: Activity) => number | null,
  agg: 'sum' | 'mean',
  o: StatOpts,
): Stat {
  const calc = (start: string, end: string) => {
    const v = nums(actsIn(data, start, end, filter).map(valueOf))
    return { v: agg === 'sum' ? sum(v) : mean(v), n: v.length }
  }
  const cur = calc(p.start, p.end)
  const prev = calc(p.prevStart, p.prevEnd)
  const ok = canCompare(p, data) && (agg === 'sum' || prev.n > 0)
  return {
    value: cur.v,
    n: cur.n,
    delta: ok ? makeDelta(cur.v, prev.v, o.fmtDiff, o.higherIsBetter, `vs ${p.prevLabel}`, o.flatBelow) : null,
    spark: p.buckets.map((b) => {
      const v = nums(actsIn(data, b.start, b.end, filter).map(valueOf))
      return agg === 'sum' ? sum(v) : mean(v)
    }),
  }
}

// ---------------------------------------------------------------- chart rows

/** A chart row. `go` is where clicking it leads (see dayHref and friends). */
export type Row = { label: string; full: string; go?: string; [k: string]: string | number | null | undefined }

/**
 * Rows for a trend of daily metrics: one per day, or one per week (mean of the
 * days that have data) on the 12-month range. Missing stays null, never 0.
 */
export function trendRows(p: Period, data: Dataset, picks: Record<string, (d: Day) => number | null>): Row[] {
  const keys = Object.keys(picks)
  if (!p.weeklyTrend) {
    return dayList(data, p.start, p.end).map((d) => {
      const row: Row = { label: p.buckets.find((b) => b.start === d.date)?.label ?? fmtDay(d.date), full: fmtFull(d.date), go: dayHref(d.date) }
      for (const k of keys) row[k] = picks[k](d)
      return row
    })
  }
  const rows: Row[] = []
  if (p.trendUnit === 'month') {
    for (let s = monthStart(p.start); s <= p.end; s = addMonths(s, 1)) {
      const last = addDays(addMonths(s, 1), -1)
      const ds = dayList(data, s < p.start ? p.start : s, last < p.end ? last : p.end)
      const name = `${fmtMonth(s)} ${s.slice(0, 4)}`
      const row: Row = { label: `${fmtMonth(s)} ${s.slice(2, 4)}`, full: `${name} (average)`, go: monthHref(s) }
      for (const k of keys) row[k] = mean(nums(ds.map(picks[k])))
      rows.push(row)
    }
    return rows
  }
  for (let s = mondayOf(p.start); s <= p.end; s = addDays(s, 7)) {
    const e = addDays(s, 6) < p.end ? addDays(s, 6) : p.end
    const ds = dayList(data, s < p.start ? p.start : s, e)
    const row: Row = { label: fmtDay(s), full: `Week of ${fmtDay(s)} (average)`, go: weekHref(s) }
    for (const k of keys) row[k] = mean(nums(ds.map(picks[k])))
    rows.push(row)
  }
  return rows
}

/** Rows for volume bars: activities aggregated into the period's buckets. */
export function bucketRows(
  p: Period,
  data: Dataset,
  series: Record<string, { filter?: (a: Activity) => boolean; value: (a: Activity) => number | null }>,
): Row[] {
  return p.buckets.map((b) => {
    const row: Row = { label: b.label, full: b.full, go: b.go }
    for (const [k, s] of Object.entries(series)) {
      row[k] = sum(nums(actsIn(data, b.start, b.end, s.filter).map(s.value)))
    }
    return row
  })
}

/** Daily totals summed into the period's buckets (null when no day has data). */
export function bucketDayRows(p: Period, data: Dataset, picks: Record<string, (d: Day) => number | null>): Row[] {
  return p.buckets.map((b) => {
    const ds = dayList(data, b.start, b.end)
    const row: Row = { label: b.label, full: b.full, go: b.go }
    for (const [k, pick] of Object.entries(picks)) {
      const v = nums(ds.map(pick))
      row[k] = v.length ? sum(v) : null
    }
    return row
  })
}
