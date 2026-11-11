/** Local-calendar date helpers. Dates are plain 'YYYY-MM-DD' strings throughout. */
const pad = (n: number) => String(n).padStart(2, '0')

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseISO = (s: string) => new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10))
export const today = () => toISO(new Date())

export function addDays(s: string, n: number): string {
  const d = parseISO(s)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** Whole days from a to b (b - a). */
export const diffDays = (a: string, b: string) =>
  Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000)

export function mondayOf(s: string): string {
  const wd = (parseISO(s).getDay() + 6) % 7
  return addDays(s, -wd)
}

export const monthStart = (s: string) => `${s.slice(0, 7)}-01`

export function addMonths(s: string, n: number): string {
  const d = parseISO(monthStart(s))
  d.setMonth(d.getMonth() + n)
  return toISO(d)
}

export function eachDay(from: string, to: string): string[] {
  const out: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', o)
const DAY = f({ day: 'numeric', month: 'short' })
const WEEKDAY = f({ weekday: 'short' })
const MONTH = f({ month: 'short' })
const FULL = f({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

const DATE = f({ day: 'numeric', month: 'short', year: 'numeric' })
const MONTH_YEAR = f({ month: 'long', year: 'numeric' })
/** '6 Oct 2025' */
export const fmtDate = (s: string) => DATE.format(parseISO(s))
/** 'March 2031' */
export const fmtMonthYear = (s: string) => MONTH_YEAR.format(parseISO(s))
export const fmtDay = (s: string) => DAY.format(parseISO(s))
export const fmtWeekday = (s: string) => WEEKDAY.format(parseISO(s))
export const fmtMonth = (s: string) => MONTH.format(parseISO(s))
export const fmtFull = (s: string) => FULL.format(parseISO(s))
