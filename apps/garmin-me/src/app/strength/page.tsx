import { ActivityTable } from '@/components/ActivityTable'
import { ChartCard } from '@/components/ChartCard'
import { Kpi } from '@/components/Kpi'
import { Grid, Section, Shell, type Ctx, type PageProps } from '@/components/Shell'
import { C, SPORT_COLOR } from '@/lib/colors'
import { fmtHours, fmtInt } from '@/lib/format'
import type { Activity } from '@/lib/garmin/normalize'
import { actStat, actsIn, bucketRows } from '@/lib/metrics'

export const dynamic = 'force-dynamic'
const isStrength = (a: Activity) => a.sport === 'strength'

export default function Page({ searchParams }: PageProps) {
  return (
    <Shell title="Strength" searchParams={searchParams}>
      {(ctx) => <Strength {...ctx} />}
    </Shell>
  )
}

function Strength({ period, data }: Ctx) {
  const sessions = actsIn(data, period.start, period.end, isStrength)
  const count = actStat(period, data, isStrength, () => 1, 'sum', { fmtDiff: (v) => fmtInt(v), higherIsBetter: null })
  const time = actStat(period, data, isStrength, (a) => a.durationH, 'sum', { fmtDiff: fmtHours, higherIsBetter: null, flatBelow: 1 / 60 })
  const avg = actStat(period, data, isStrength, (a) => a.durationH, 'mean', { fmtDiff: fmtHours, higherIsBetter: null, flatBelow: 1 / 60 })
  const hr = actStat(period, data, isStrength, (a) => a.avgHr, 'mean', { fmtDiff: (v) => `${fmtInt(v)} bpm`, higherIsBetter: null, flatBelow: 0.5 })
  const color = SPORT_COLOR.strength

  return (
    <>
      <Section title={`Last ${period.label}`}>
        <Grid>
          <Kpi label="Sessions" value={fmtInt(count.value ?? 0)} delta={count.delta} spark={count.spark} color={color} source="calc" />
          <Kpi label="Total time" value={time.n ? fmtHours(time.value ?? 0) : null} delta={time.delta} spark={time.spark} color={color} source="calc" />
          <Kpi label="Avg session" value={avg.value !== null ? fmtHours(avg.value) : null} delta={avg.delta} spark={avg.spark} color={color} source="calc" />
          <Kpi label="Avg heart rate" value={hr.value !== null ? fmtInt(hr.value) : null} unit="bpm" sub={hr.value !== null ? 'Mean of each session’s average' : undefined} delta={hr.delta} color={C.heart} source="calc" />
        </Grid>
      </Section>

      <Section title="Consistency">
        <Grid cols={2}>
          <ChartCard title="Strength sessions" subtitle={`Sessions per ${period.bucketNoun}`} source="calc" kind="bar" fmt="count" data={bucketRows(period, data, { n: { filter: isStrength, value: () => 1 } })} series={[{ key: 'n', name: 'Sessions', color }]} />
          <ChartCard title="Strength training time" subtitle={`Hours per ${period.bucketNoun}`} source="calc" kind="bar" fmt="hours" data={bucketRows(period, data, { h: { filter: isStrength, value: (a) => a.durationH } })} series={[{ key: 'h', name: 'Time', color }]} />
        </Grid>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Garmin only has a duration, heart rate and training load for your strength sessions. Exercises, sets, reps and
          weights aren&apos;t in the data (each session is saved as a single set), so they aren&apos;t shown here.
        </p>
      </Section>

      <Section title="Sessions" hint={`${sessions.length} in range`}>
        <ActivityTable activities={sessions.slice(0, 30)} empty={`No strength sessions in the last ${period.label}`} />
      </Section>
    </>
  )
}
