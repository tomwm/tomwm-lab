/**
 * Locally calculated aggregates: period windows, buckets, means, sums and
 * period-over-period comparisons. Nothing here calls Garmin. Anything built
 * from these helpers is labelled "Calculated" in the UI, as opposed to values
 * Garmin reports directly.
 */
import {
  addDays, addMonths, diffDays, eachDay, fmtDay, fmtFull, fmtMonth, fmtWeekday, mondayOf, monthStart, today,
} from './dates'
import type { Dataset } from './data'
import { emptyDay, type Activity, type Day } from './garmin/normalize'

export type RangeKey = '7d' | '30d' | '12w' | '12m'
export const RANGES: { key: RangeKey; label: string; short: string; adj: string }[] = [
  { key: '7d', label: '7 days', short: '7D', adj: '7-day' },
  { key: '30d', label: '30 days', short: '30D', adj: '30-day' },
  { key: '12w', label: '12 weeks', short: '12W', adj: '12-week' },
  { key: '12m', label: '12 months', short: '12M', adj: '12-month' },
]
export const parseRange = (v: unknown): RangeKey =>
  RANGES.some((r) => r.key === v) ? (v as RangeKey) : '30d'

export type Bucket = { label: string; full: string; start: string; end: string }
export type Period = {
  range: RangeKey
  label: string
  /** '30-day', for "vs 30-day average". */
  adj: string
  start: string
  end: string
  prevStart: string
  prevEnd: string
  /** Buckets for volume bars: days (7d/30d), weeks (12w) or months (12m). */
  buckets: Bucket[]
  bucketNoun: 'day' | 'week' | 'month'
  /** Daily metrics are shown per day, except 12m where they are weekly means. */
  weeklyTrend: boolean
}

export function makePeriod(range: RangeKey, end = today()): Period {
  let start: string
  let buckets: Bucket[]
  let bucketNoun: Period['bucketNoun']
  if (range === '7d' || range === '30d') {
    start = addDays(end, range === '7d' ? -6 : -29)
    bucketNoun = 'day'
    buckets = eachDay(start, end).map((d) => ({
      label: range === '7d' ? fmtWeekday(d) : fmtDay(d),
      full: fmtFull(d),
      start: d,
      end: d,
    }))
  } else if (range === '12w') {
    start = addDays(mondayOf(end), -77)
    bucketNoun = 'week'
    buckets = Array.from({ length: 12 }, (_, i) => {
      const s = addDays(start, i * 7)
      const e = addDays(s, 6) < end ? addDays(s, 6) : end
      return { label: fmtDay(s), full: `Week of ${fmtDay(s)}${e === end && diffDays(s, e) < 6 ? ' (so far)' : ''}`, start: s, end: e }
    })
  } else {
    start = addMonths(monthStart(end), -11)
    bucketNoun = 'month'
    buckets = Array.from({ length: 12 }, (_, i) => {
      const s = addMonths(start, i)
      const last = addDays(addMonths(s, 1), -1)
      const e = last < end ? last : end
      return { label: fmtMonth(s), full: `${fmtMonth(s)} ${s.slice(0, 4)}${e === end && e !== last ? ' (so far)' : ''}`, start: s, end: e }
    })
  }
  const len = diffDays(start, end) + 1
  const prevEnd = addDays(start, -1)
  return {
    range,
    label: RANGES.find((r) => r.key === range)!.label,
    adj: RANGES.find((r) => r.key === range)!.adj,
    start,
    end,
    prevStart: addDays(prevEnd, -(len - 1)),
    prevEnd,
    buckets,
    bucketNoun,
    weeklyTrend: range === '12m',
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
export const canCompare = (p: Period, data: Dataset) => !!data.syncedFrom && data.syncedFrom <= p.prevStart

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
    delta: ok ? makeDelta(m, mean(prev), o.fmtDiff, o.higherIsBetter, `vs previous ${p.label}`, o.flatBelow) : null,
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
    delta: ok ? makeDelta(cur.v, prev.v, o.fmtDiff, o.higherIsBetter, `vs previous ${p.label}`, o.flatBelow) : null,
    spark: p.buckets.map((b) => {
      const v = nums(actsIn(data, b.start, b.end, filter).map(valueOf))
      return agg === 'sum' ? sum(v) : mean(v)
    }),
  }
}

// ---------------------------------------------------------------- chart rows

export type Row = { label: string; full: string; [k: string]: string | number | null }

/**
 * Rows for a trend of daily metrics: one per day, or one per week (mean of the
 * days that have data) on the 12-month range. Missing stays null, never 0.
 */
export function trendRows(p: Period, data: Dataset, picks: Record<string, (d: Day) => number | null>): Row[] {
  const keys = Object.keys(picks)
  if (!p.weeklyTrend) {
    return dayList(data, p.start, p.end).map((d) => {
      const row: Row = { label: p.range === '7d' ? fmtWeekday(d.date) : fmtDay(d.date), full: fmtFull(d.date) }
      for (const k of keys) row[k] = picks[k](d)
      return row
    })
  }
  const rows: Row[] = []
  for (let s = mondayOf(p.start); s <= p.end; s = addDays(s, 7)) {
    const e = addDays(s, 6) < p.end ? addDays(s, 6) : p.end
    const ds = dayList(data, s < p.start ? p.start : s, e)
    const row: Row = { label: fmtDay(s), full: `Week of ${fmtDay(s)} (average)` }
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
    const row: Row = { label: b.label, full: b.full }
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
    const row: Row = { label: b.label, full: b.full }
    for (const [k, pick] of Object.entries(picks)) {
      const v = nums(ds.map(pick))
      row[k] = v.length ? sum(v) : null
    }
    return row
  })
}
