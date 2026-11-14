import { ActivityTable } from '@/components/ActivityTable'
import { BodyMap } from '@/components/BodyMap'
import { ChartCard } from '@/components/ChartCard'
import { Kpi, SourceTag } from '@/components/Kpi'
import { Grid, Section, Shell, type Ctx, type PageProps } from '@/components/Shell'
import { C, SPORT_COLOR } from '@/lib/colors'
import { fmtHours, fmtInt } from '@/lib/format'
import type { Activity } from '@/lib/garmin/normalize'
import { actStat, actsIn, bucketRows } from '@/lib/metrics'
import { muscleWork, topExercises } from '@/lib/muscles'

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
  const work = muscleWork(sessions)
  const top = topExercises(sessions)

  return (
    <>
      <Section title={period.title.charAt(0).toUpperCase() + period.title.slice(1)}>
        <Grid>
          <Kpi label="Sessions" value={fmtInt(count.value ?? 0)} delta={count.delta} spark={count.spark} color={color} source="garmin" />
          <Kpi label="Total time" value={time.n ? fmtHours(time.value ?? 0) : null} delta={time.delta} spark={time.spark} color={color} source="garmin" />
          <Kpi label="Avg session" value={avg.value !== null ? fmtHours(avg.value) : null} delta={avg.delta} spark={avg.spark} color={color} source="garmin" />
          <Kpi label="Avg heart rate" value={hr.value !== null ? fmtInt(hr.value) : null} unit="bpm" sub={hr.value !== null ? 'Mean of each session’s average' : undefined} delta={hr.delta} color={C.heart} source="estimate" />
        </Grid>
      </Section>

      <Section title="Consistency">
        <Grid cols={2}>
          <ChartCard title="Strength sessions" subtitle={`Sessions per ${period.bucketNoun}`} source="garmin" kind="bar" fmt="count" data={bucketRows(period, data, { n: { filter: isStrength, value: () => 1 } })} series={[{ key: 'n', name: 'Sessions', color }]} />
          <ChartCard title="Strength training time" subtitle={`Hours per ${period.bucketNoun}`} source="garmin" kind="bar" fmt="hours" data={bucketRows(period, data, { h: { filter: isStrength, value: (a) => a.durationH } })} series={[{ key: 'h', name: 'Time', color }]} />
        </Grid>
      </Section>

      <Section title="Muscles worked">
        <BodyMap sets={work.sets} placed={work.placed} unplaced={work.unplaced} rangeTitle={period.title} />
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
          <div className="flex items-start justify-between gap-3 px-4 pb-1 pt-4 md:px-5">
            <div>
              <h3 className="text-sm font-medium text-ink">Top exercises</h3>
              <p className="mt-0.5 text-xs text-muted">As identified by your watch, ranked by sets</p>
            </div>
            <SourceTag source="garmin" />
          </div>
          {top.length === 0 ? (
            <p className="px-5 pb-6 pt-2 text-sm text-muted">No identified exercises in this range</p>
          ) : (
            <table className="w-full min-w-[30rem] text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium md:px-5">Exercise</th>
                  <th className="px-3 py-2.5 text-left font-medium">Mainly works</th>
                  <th className="px-3 py-2.5 text-right font-medium">Sessions</th>
                  <th className="px-3 py-2.5 text-right font-medium">Sets</th>
                  <th className="px-4 py-2.5 text-right font-medium md:px-5">Reps</th>
                </tr>
              </thead>
              <tbody>
                {top.map((e) => (
                  <tr key={e.name} className="border-t border-line">
                    <td className="px-4 py-2.5 md:px-5">{e.name}</td>
                    <td className="px-3 py-2.5 text-ink-2">{e.main}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtInt(e.sessions)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtInt(e.sets)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums md:px-5">{fmtInt(e.reps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Exercises and reps come from your watch&apos;s automatic rep counting, so they are only as good as its guesses, and
          sessions where you didn&apos;t log sets may be saved as one long set. Garmin doesn&apos;t record the weights you lifted.
        </p>
      </Section>

      <Section title="Sessions" hint={`${sessions.length} in range`}>
        <ActivityTable activities={sessions.slice(0, 30)} empty={`No strength sessions in ${period.range === 'all' ? 'your history' : period.title.startsWith('last') ? `the ${period.title}` : period.title}`} />
      </Section>
    </>
  )
}
