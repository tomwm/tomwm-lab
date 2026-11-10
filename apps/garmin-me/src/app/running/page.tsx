import { ActivityTable } from '@/components/ActivityTable'
import { ChartCard } from '@/components/ChartCard'
import { Kpi } from '@/components/Kpi'
import { Grid, Section, Shell, type Ctx, type PageProps } from '@/components/Shell'
import { ZoneBar } from '@/components/ZoneBar'
import { C, SPORT_COLOR } from '@/lib/colors'
import { fmtDay, fmtFull } from '@/lib/dates'
import { fmtHours, fmtInt, fmtOne, fmtPace } from '@/lib/format'
import type { Activity } from '@/lib/garmin/normalize'
import { actStat, actsIn, bucketRows, canCompare, makeDelta, nums, sum } from '@/lib/metrics'

export const dynamic = 'force-dynamic'
const isRun = (a: Activity) => a.sport === 'running'

export default function Page({ searchParams }: PageProps) {
  return (
    <Shell title="Running" searchParams={searchParams}>
      {(ctx) => <Running {...ctx} />}
    </Shell>
  )
}

/** Distance-weighted average pace: total moving time / total distance. */
function avgPace(runs: Activity[]): number | null {
  const r = runs.filter((a) => a.distanceKm && a.paceSecPerKm)
  const km = sum(r.map((a) => a.distanceKm!))
  return km > 0 ? sum(r.map((a) => a.paceSecPerKm! * a.distanceKm!)) / km : null
}

function Running({ period, data }: Ctx) {
  const runs = actsIn(data, period.start, period.end, isRun)
  const prevRuns = actsIn(data, period.prevStart, period.prevEnd, isRun)
  const chrono = [...runs].reverse()

  const km = actStat(period, data, isRun, (a) => a.distanceKm, 'sum', { fmtDiff: (v) => `${fmtOne(v)} km`, higherIsBetter: null, flatBelow: 0.05 })
  const count = actStat(period, data, isRun, () => 1, 'sum', { fmtDiff: (v) => fmtInt(v), higherIsBetter: null })
  const hr = actStat(period, data, isRun, (a) => a.avgHr, 'mean', { fmtDiff: (v) => `${fmtInt(v)} bpm`, higherIsBetter: null, flatBelow: 0.5 })
  const pace = avgPace(runs)
  const paceDelta = canCompare(period, data)
    ? makeDelta(pace, avgPace(prevRuns), (v) => `${Math.round(v)}s /km`, false, `vs previous ${period.label}`, 0.5)
    : null
  const time = sum(runs.map((a) => a.durationH))
  const climb = sum(nums(runs.map((a) => a.elevGainM)))
  const zones = [0, 1, 2, 3, 4].map((i) => sum(runs.map((a) => a.zonesSec?.[i] ?? 0)))

  const perRun = chrono.map((a) => ({ label: fmtDay(a.date), full: `${a.name} · ${fmtFull(a.date)}`, pace: a.paceSecPerKm, hr: a.avgHr }))

  return (
    <>
      <Section title={`Last ${period.label}`}>
        <Grid>
          <Kpi label="Distance" value={fmtOne(km.value ?? 0)} unit="km" sub={runs.length ? `${fmtHours(time)} · ${fmtInt(climb)} m climbed` : undefined} delta={km.delta} spark={km.spark} color={SPORT_COLOR.running} source="calc" />
          <Kpi label="Runs" value={fmtInt(count.value ?? 0)} delta={count.delta} spark={count.spark} color={SPORT_COLOR.running} source="calc" />
          <Kpi label="Avg pace" value={pace !== null ? fmtPace(pace) : null} unit="/km" sub={pace !== null ? 'Total moving time ÷ distance' : undefined} delta={paceDelta} color={SPORT_COLOR.running} source="calc" />
          <Kpi label="Avg heart rate" value={hr.value !== null ? fmtInt(hr.value) : null} unit="bpm" sub={hr.value !== null ? 'Mean of each run’s average' : undefined} delta={hr.delta} color={C.heart} source="calc" />
        </Grid>
      </Section>

      <Section title="Volume and effort">
        <Grid cols={2}>
          <ChartCard
            title="Running distance"
            subtitle={`Kilometres per ${period.bucketNoun}`}
            source="calc"
            kind="bar"
            fmt="km"
            data={bucketRows(period, data, { km: { filter: isRun, value: (a) => a.distanceKm } })}
            series={[{ key: 'km', name: 'Distance', color: SPORT_COLOR.running }]}
          />
          <ZoneBar title="Time in heart-rate zones" subtitle={`All runs in the last ${period.label}`} zonesSec={zones} />
          <ChartCard
            title="Pace per run"
            subtitle="Minutes per km. Faster is higher."
            source="calc"
            kind="line"
            fmt="pace"
            reversed
            data={perRun}
            series={[{ key: 'pace', name: 'Pace', color: SPORT_COLOR.running }]}
          />
          <ChartCard
            title="Average heart rate per run"
            subtitle="bpm"
            source="garmin"
            kind="line"
            fmt="bpm"
            data={perRun}
            series={[{ key: 'hr', name: 'Avg HR', color: C.heart }]}
          />
        </Grid>
      </Section>

      <Section title="Runs" hint={`${runs.length} in range`}>
        <ActivityTable activities={runs.slice(0, 30)} empty={`No runs in the last ${period.label}`} />
      </Section>
    </>
  )
}
