'use client'

import { useMemo, useState } from 'react'
import { addDays, fmtDate, fmtMonthYear } from '@/lib/dates'
import { fmtInt, fmtOne } from '@/lib/format'
import { ROUTES, type Route } from './routes'
import { Pills, resolveSpan, SpanNote, SpanPills, type Span } from './span'
import { Big, Tile } from './Tile'

/** Project a route's waypoints into SVG space; wide routes get a landscape map. */
function layout(route: Route) {
  const lats = route.stops.map((s) => s.lat)
  const lons = route.stops.map((s) => s.lon)
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)]
  const [minLon, maxLon] = [Math.min(...lons), Math.max(...lons)]
  const squash = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const dx = (maxLon - minLon) * squash
  const dy = maxLat - minLat
  const wide = dx > dy * 1.2
  const k = wide ? Math.min(600 / dx, 190 / dy) : Math.min(170 / dx, 380 / dy)
  const padX = wide ? 44 : 14
  const padY = wide ? 28 : 12
  const pts = route.stops.map((s) => ({ ...s, x: padX + (s.lon - minLon) * squash * k, y: padY + (maxLat - s.lat) * k }))
  const seg = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y))
  const total = seg.reduce((a, b) => a + b, 0)
  /** Kilometre mark of each stop along the real route. */
  const mark = pts.map((_, i) => (seg.slice(0, i).reduce((a, b) => a + b, 0) / total) * route.km)
  const pointAt = (km: number) => {
    let left = (Math.min(km, route.km) / route.km) * total
    for (let i = 0; i < seg.length; i++) {
      if (left <= seg[i]) {
        const t = seg[i] ? left / seg[i] : 0
        return { i, x: pts[i].x + (pts[i + 1].x - pts[i].x) * t, y: pts[i].y + (pts[i + 1].y - pts[i].y) * t }
      }
      left -= seg[i]
    }
    return { i: seg.length - 1, x: pts[pts.length - 1].x, y: pts[pts.length - 1].y }
  }
  return { wide, pts, mark, pointAt, W: wide ? padX * 2 + dx * k : padX + dx * k + 112, H: padY * 2 + dy * k }
}

/**
 * Your total distance on foot laid along a famous route. Pick the route and
 * which dates count; the tile always states the exact dates used.
 */
export function Journey({ daily, runs, today }: { daily: { date: string; km: number }[]; runs: { date: string; km: number }[]; today: string }) {
  const [routeKey, setRouteKey] = useState(ROUTES[0].key)
  const [span, setSpan] = useState<Span>('all')
  const route = ROUTES.find((r) => r.key === routeKey)!
  const map = useMemo(() => layout(route), [route])

  const loadedFrom = daily[0]?.date ?? null
  const { from, days: spanDays } = resolveSpan(span, today, loadedFrom)
  const days = daily.filter((d) => d.date >= from)
  const totalKm = days.reduce((a, d) => a + d.km, 0)
  const runKm = runs.filter((r) => r.date >= from).reduce((a, r) => a + r.km, 0)
  const perDay = spanDays > 0 ? totalKm / spanDays : 0

  const trips = Math.floor(totalKm / route.km)
  const km = totalKm - trips * route.km // progress on the current trip
  const here = map.pointAt(km)
  const nextIdx = map.mark.findIndex((m) => m > km)
  const last = route.stops[nextIdx > 0 ? nextIdx - 1 : 0]
  const remaining = route.km - km
  const eta = perDay > 0 ? addDays(today, Math.ceil(remaining / perDay)) : null

  // When each earlier trip was finished, and when each stop was reached on the current one.
  const finished: string[] = []
  const reached: (string | null)[] = map.mark.map(() => null)
  const base = trips * route.km
  let acc = 0
  for (const d of days) {
    acc += d.km
    while (finished.length < trips && acc >= (finished.length + 1) * route.km) finished.push(d.date)
    map.mark.forEach((m, i) => {
      if (reached[i] === null && acc >= base + m) reached[i] = d.date
    })
  }
  if (trips > 0) reached[0] = finished[trips - 1] // the new trip starts where the last one ended
  const pct = Math.round((km / route.km) * 100)
  const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')}`

  const str = (ps: { x: number; y: number }[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  let labelled = 0

  return (
    <Tile title="How far have you walked?" subtitle="Every step you've taken, laid end to end along a famous route" source="estimate">
      <div className="mb-3 flex flex-col gap-2">
        <Pills label="Route" options={ROUTES.map((r) => ({ key: r.key, label: r.tab }))} value={routeKey} onChange={setRouteKey} />
        <SpanPills span={span} onChange={setSpan} today={today} />
      </div>

      <SpanNote span={span} today={today} loadedFrom={loadedFrom} detail={`${days.length} with a recording`} />

      <div className={`flex flex-col gap-6 ${map.wide ? '' : 'sm:flex-row'}`}>
        <svg
          viewBox={`0 0 ${map.W.toFixed(0)} ${map.H.toFixed(0)}`}
          className={map.wide ? 'mx-auto w-full max-w-3xl' : 'mx-auto h-[400px] shrink-0 sm:mx-0'}
          role="img"
          aria-label={`${route.title}: ${fmtInt(km)} of ${fmtInt(route.km)} km covered`}
        >
          <polyline points={str(map.pts)} fill="none" stroke="var(--axis)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {trips > 0 && <polyline points={str(map.pts)} fill="none" stroke="var(--s1)" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          <polyline points={str([...map.pts.slice(0, here.i + 1), here])} fill="none" stroke="var(--s1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {map.pts.map((p, i) => {
            const passed = map.mark[i] <= km
            const below = map.wide && p.label !== false && labelled++ % 2 === 1
            return (
              <g key={p.name}>
                <circle cx={p.x} cy={p.y} r={p.label === false ? 2.5 : 3.5} fill={passed ? 'var(--s1)' : 'var(--surface)'} stroke={passed ? 'var(--surface)' : 'var(--axis)'} strokeWidth="1.5" />
                {p.label !== false && (
                  <text
                    x={map.wide ? p.x : p.x + 9}
                    y={map.wide ? (below ? p.y + 17 : p.y - 9) : p.y + 3.5}
                    textAnchor={map.wide ? 'middle' : 'start'}
                    fontSize="10.5"
                    fill={passed ? 'var(--ink-2)' : 'var(--muted)'}
                  >
                    {p.name}
                  </text>
                )}
              </g>
            )
          })}
          <circle cx={here.x} cy={here.y} r="7" fill="var(--s1)" stroke="var(--surface)" strokeWidth="2.5" />
        </svg>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div>
            <h3 className="text-sm font-medium text-ink">{route.title}</h3>
            <p className="mb-3 text-xs text-muted">{route.blurb}</p>
            <Big
              value={fmtInt(km)}
              unit={`of ${fmtInt(route.km)} km${trips > 0 ? `, on your ${ordinal(trips + 1)} trip` : ''}`}
              caption={
                (trips > 0
                  ? `You've completed this route ${trips === 1 ? 'once' : `${fmtInt(trips)} times`} and are ${pct}% of the way through trip ${fmtInt(trips + 1)} (${fmtInt(totalKm)} km in all). You're past ${last.name}`
                  : `${pct}% of the way. You're past ${last.name}`) +
                (nextIdx > 0 ? `, with ${fmtInt(map.mark[nextIdx] - km)} km to ${route.stops[nextIdx].name}.` : '.')
              }
            />

            {/* One bar per trip: full for each finished trip, part-filled for the current one. */}
            <div className="mt-4" role="img" aria-label={`${trips} completed trip${trips === 1 ? '' : 's'}; trip ${trips + 1} is ${pct}% done`}>
              {trips <= 7 ? (
                <div className="flex gap-1.5">
                  {Array.from({ length: trips + 1 }, (_, i) => (
                    <div key={i} className="min-w-0 flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-wash">
                        <div className="h-full rounded-full" style={{ width: `${i < trips ? 100 : pct}%`, background: 'var(--s1)' }} />
                      </div>
                      <div className="mt-1.5 truncate text-[11px] leading-tight">
                        <span className="font-medium text-ink">Trip {i + 1}</span>{' '}
                        <span className="text-muted">{i < trips ? `✓ finished ${fmtDate(finished[i])}` : `${pct}% so far`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="h-2 overflow-hidden rounded-full bg-wash">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--s1)' }} />
                  </div>
                  <div className="mt-1.5 text-[11px] text-muted">
                    <span className="font-medium text-ink">✓ {fmtInt(trips)} trips finished</span> (latest {fmtDate(finished[trips - 1])}) · trip {fmtInt(trips + 1)} is {pct}% so far
                  </div>
                </>
              )}
            </div>
          </div>
          <ul className="text-xs text-ink-2">
            <li className="flex justify-between border-t border-line py-1.5"><span>Your average over these dates</span><span className="tabular-nums text-ink">{fmtOne(perDay)} km a day</span></li>
            <li className="flex justify-between border-t border-line py-1.5"><span>Of which running</span><span className="tabular-nums text-ink">{fmtInt(runKm)} km</span></li>
            <li className="flex justify-between border-t border-line py-1.5">
              <span>{trips > 0 ? 'Next finish at this rate' : 'Finish at this rate'}</span>
              <span className="tabular-nums text-ink">{eta ? `${fmtMonthYear(eta)} (${fmtInt(Math.ceil(remaining / perDay))} days)` : '–'}</span>
            </li>
          </ul>
          <div>
            <h4 className="mb-1 text-xs font-medium text-ink-2">
              {trips > 0 ? `Places reached on trip ${fmtInt(trips + 1)}` : 'Places reached'}
            </h4>
          <ol className="grid gap-x-8 text-xs md:grid-cols-2">
            {route.stops.map((s, i) => (
              <li key={s.name} className="flex items-baseline gap-2 border-t border-line py-1.5">
                <span className={`whitespace-nowrap ${reached[i] ? 'text-ink' : 'text-muted'}`}>{s.name}</span>
                <span className="ml-auto tabular-nums text-muted">{fmtInt(map.mark[i])} km</span>
                <span className="w-20 text-right tabular-nums text-ink-2">{reached[i] ? fmtDate(reached[i]!) : '–'}</span>
              </li>
            ))}
          </ol>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            {trips > 0 && 'On the map, the pale line is the route you have already completed and the bright line is the current trip. '}
            Uses Garmin&apos;s total daily distance on foot, which includes walking around the house. Routes are simplified
            to straight lines between a few places and scaled to the real route&apos;s length, so town distances are
            approximate.
          </p>
        </div>
      </div>
    </Tile>
  )
}
