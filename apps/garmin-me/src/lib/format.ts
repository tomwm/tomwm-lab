/** Display formatting shared by server and client components. Metric units. */
export type Fmt = 'int' | 'km' | 'hours' | 'pace' | 'bpm' | 'ms' | 'score' | 'kcal' | 'm' | 'count' | 'kg' | 'pct'

const INT = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })
const ONE = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Decimal hours -> "7h 23m" / "45m". */
export function fmtHours(h: number): string {
  const mins = Math.round(h * 60)
  const hh = Math.floor(mins / 60)
  const mm = mins % 60
  if (hh === 0) return `${mm}m`
  return `${hh}h ${String(mm).padStart(2, '0')}m`
}

/** Seconds per km -> "5:42". */
export function fmtPace(secPerKm: number): string {
  const s = Math.round(secPerKm)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Full value with unit, for KPI values, tooltips and tables. */
export function formatValue(fmt: Fmt, v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '–'
  switch (fmt) {
    case 'km':
      return `${ONE.format(v)} km`
    case 'hours':
      return fmtHours(v)
    case 'pace':
      return `${fmtPace(v)} /km`
    case 'bpm':
      return `${INT.format(v)} bpm`
    case 'ms':
      return `${INT.format(v)} ms`
    case 'kcal':
      return `${INT.format(v)} kcal`
    case 'm':
      return `${INT.format(v)} m`
    case 'kg':
      return `${ONE.format(v)} kg`
    case 'pct':
      return `${ONE.format(v)}%`
    default:
      return INT.format(v)
  }
}

/** Compact axis tick. */
export function formatTick(fmt: Fmt, v: number): string {
  switch (fmt) {
    case 'hours':
      return `${Number.isInteger(v) ? v : v.toFixed(1)}h`
    case 'pace':
      return fmtPace(v)
    case 'km':
      return INT.format(v)
    default:
      return Math.abs(v) >= 10_000 ? `${Math.round(v / 1000)}K` : INT.format(v)
  }
}

export const fmtInt = (v: number) => INT.format(v)
export const fmtOne = (v: number) => ONE.format(v)
