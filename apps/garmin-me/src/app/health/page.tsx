import { ActivityTable } from '@/components/ActivityTable'
import { ChartCard } from '@/components/ChartCard'
import { Kpi } from '@/components/Kpi'
import { Grid, Section, Shell, type Ctx, type PageProps } from '@/components/Shell'
import { C, SPORT_COLOR } from '@/lib/colors'
import { fmtInt } from '@/lib/format'
import { SPORT_LABEL, SPORTS, type Activity, type Day } from '@/lib/garmin/normalize'
import { actsIn, bucketDayRows, bucketRows, dayStat, latest, trendRows } from '@/lib/metrics'

export const dynamic = 'force-dynamic'
const isOther = (a: Activity) => a.sport !== 'running' && a.sport !== 'strength'
/** Garmin's weekly-goal weighting: vigorous minutes count double. */
const intensity = (d: Day) => (d.intensityMod === null && d.intensityVig === null ? null : (d.intensityMod ?? 0) + 2 * (d.intensityVig ?? 0))

export default function Page({ searchParams }: PageProps) {
  return (
    <Shell title="Health" searchParams={searchParams}>
      {(ctx) => <Health {...ctx} />}
    </Shell>
  )
}

function Health({ period, data }: Ctx) {
  const n = (v: number) => fmtInt(v)
  const steps = dayStat(period, data, (d) => d.steps, { fmtDiff: n, higherIsBetter: true, flatBelow: 50 }, { excludeToday: true })
  const mins = dayStat(period, data, intensity, { fmtDiff: (v) => `${n(v)} min`, higherIsBetter: true, flatBelow: 0.5 }, { excludeToday: true })
  const stress = dayStat(period, data, (d) => d.stressAvg, { fmtDiff: n, higherIsBetter: false, flatBelow: 0.5 })
  const kcal = dayStat(period, data, (d) => d.activeKcal, { fmtDiff: (v) => `${n(v)} kcal`, higherIsBetter: null, flatBelow: 5 }, { excludeToday: true })
  const goal = latest(data, (d) => d.stepGoal)
  const others = actsIn(data, period.start, period.end, isOther)
  const otherSports = SPORTS.filter((s) => s !== 'running' && s !== 'strength')
  const perDay = period.weeklyTrend ? 'Weekly average per day' : 'Per day'

  return (
    <>
      <Section title={`Daily averages · last ${period.label}`} hint="Complete days only">
        <Grid>
          <Kpi label="Steps / day" value={steps.value !== null ? n(steps.value) : null} delta={steps.delta} spark={steps.spark} color={C.steps} source="calc" />
          <Kpi label="Intensity min / day" value={mins.value !== null ? n(mins.value) : null} unit="min" sub={mins.value !== null ? 'Moderate + 2 × vigorous' : undefined} delta={mins.delta} spark={mins.spark} color="var(--s3)" source="calc" />
          <Kpi label="Stress" value={stress.value !== null ? n(stress.value) : null} sub={stress.value !== null ? 'Daily average, 0–100' : undefined} delta={stress.delta} spark={stress.spark} color={C.stress} source="calc" />
          <Kpi label="Active kcal / day" value={kcal.value !== null ? n(kcal.value) : null} unit="kcal" delta={kcal.delta} spark={kcal.spark} color="var(--s8)" source="calc" />
        </Grid>
      </Section>

      <Section title="Daily activity">
        <Grid cols={2}>
          <ChartCard
            title="Steps"
            subtitle={goal ? `${perDay} · line shows your current goal of ${n(goal.value)}` : perDay}
            source="garmin"
            kind="bar"
            fmt="int"
            data={trendRows(period, data, { steps: (d) => d.steps })}
            series={[{ key: 'steps', name: 'Steps', color: C.steps }]}
            refLine={goal ? { y: goal.value, label: '' } : undefined}
          />
          <ChartCard
            title="Intensity minutes"
            subtitle={`Total per ${period.bucketNoun} (moderate + 2 × vigorous)`}
            source="calc"
            kind="bar"
            fmt="int"
            data={bucketDayRows(period, data, { mins: intensity })}
            series={[{ key: 'mins', name: 'Intensity minutes', color: 'var(--s3)' }]}
          />
          <ChartCard title="Stress" subtitle={`${period.weeklyTrend ? 'Weekly' : 'Daily'} average, 0–100`} source="garmin" kind="line" fmt="score" data={trendRows(period, data, { stress: (d) => d.stressAvg })} series={[{ key: 'stress', name: 'Average stress', color: C.stress }]} />
          <ChartCard title="Blood oxygen" subtitle={`${period.weeklyTrend ? 'Weekly' : 'Daily'} average SpO₂, %`} source="garmin" kind="line" fmt="score" data={trendRows(period, data, { spo2: (d) => d.spo2 })} series={[{ key: 'spo2', name: 'SpO₂', color: 'var(--s1)' }]} />
        </Grid>
      </Section>

      <Section title="Other sports" hint="Everything except running and strength">
        <ChartCard
          title="Time by sport"
          subtitle={`Hours per ${period.bucketNoun}`}
          source="calc"
          kind="bar"
          stacked
          fmt="hours"
          data={bucketRows(period, data, Object.fromEntries(otherSports.map((s) => [s, { filter: (a: Activity) => a.sport === s, value: (a: Activity) => a.durationH }])))}
          series={otherSports.map((s) => ({ key: s, name: SPORT_LABEL[s], color: SPORT_COLOR[s] }))}
        />
        <div className="mt-4">
          <ActivityTable activities={others.slice(0, 20)} empty={`No other activities in the last ${period.label}`} />
        </div>
      </Section>
    </>
  )
}
