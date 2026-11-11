import { ActivityTable } from '@/components/ActivityTable'
import { ChartCard } from '@/components/ChartCard'
import { Kpi } from '@/components/Kpi'
import { Grid, Section, Shell, type Ctx, type PageProps } from '@/components/Shell'
import { C, SPORT_COLOR } from '@/lib/colors'
import { fmtDay } from '@/lib/dates'
import { fmtInt, fmtOne } from '@/lib/format'
import { SPORT_LABEL, SPORTS, type Activity, type Day } from '@/lib/garmin/normalize'
import { actsIn, bucketDayRows, bucketRows, dayList, dayStat, latest, makeDelta, trendRows } from '@/lib/metrics'

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
  /** Latest reading of a body measure, and how it has moved since the first one in the period. */
  const body = (pick: (d: Day) => number | null, unit: string) => {
    const now = latest(data, pick, period.end, 3650)
    const inRange = dayList(data, period.start, period.end).filter((d) => pick(d) !== null)
    const first = inRange[0]
    const moved = now && first && first.date !== now.date ? makeDelta(now.value, pick(first), (v) => `${fmtOne(v)}${unit}`, null, `since ${fmtDay(first.date)}`, 0.05) : null
    return { now, n: inRange.length, moved, spark: trendRows(period, data, { v: pick }).map((r) => r.v as number | null) }
  }
  const weight = body((d) => d.weightKg, ' kg')
  const fat = body((d) => d.bodyFatPct, ' pts')
  const muscle = body((d) => d.muscleKg, ' kg')
  const bmi = body((d) => d.bmi, '')
  const weighed = (b: ReturnType<typeof body>) => (b.now ? `Weighed ${fmtDay(b.now.date)} · ${b.n} weigh-in${b.n === 1 ? '' : 's'} in range` : undefined)
  const perDay = period.weeklyTrend ? `${period.avgLabel} per day` : 'Per day'

  return (
    <>
      <Section title={`Daily averages · ${period.title}`} hint="Complete days only">
        <Grid>
          <Kpi label="Steps / day" value={steps.value !== null ? n(steps.value) : null} delta={steps.delta} spark={steps.spark} color={C.steps} source="garmin" />
          <Kpi label="Intensity min / day" value={mins.value !== null ? n(mins.value) : null} unit="min" sub={mins.value !== null ? 'Moderate + 2 × vigorous' : undefined} delta={mins.delta} spark={mins.spark} color="var(--s3)" source="estimate" />
          <Kpi label="Stress" value={stress.value !== null ? n(stress.value) : null} sub={stress.value !== null ? 'Daily average, 0–100' : undefined} delta={stress.delta} spark={stress.spark} color={C.stress} source="garmin" />
          <Kpi label="Active kcal / day" value={kcal.value !== null ? n(kcal.value) : null} unit="kcal" delta={kcal.delta} spark={kcal.spark} color="var(--s8)" source="garmin" />
        </Grid>
      </Section>

      <Section title="Daily activity">
        <Grid cols={2}>
          <ChartCard
            title="Steps"
            subtitle={perDay}
            source="garmin"
            kind="bar"
            fmt="int"
            data={trendRows(period, data, { steps: (d) => d.steps })}
            series={[{ key: 'steps', name: 'Steps', color: C.steps }]}
            refLine={goal ? { y: goal.value, label: `Current goal ${n(goal.value)}` } : undefined}
          />
          <ChartCard
            title="Intensity minutes"
            subtitle={`Total per ${period.bucketNoun} (moderate + 2 × vigorous)`}
            source="estimate"
            kind="bar"
            fmt="int"
            data={bucketDayRows(period, data, { mins: intensity })}
            series={[{ key: 'mins', name: 'Intensity minutes', color: 'var(--s3)' }]}
          />
          <ChartCard title="Stress" subtitle={`${period.avgWord} average, 0–100`} source="garmin" kind="line" fmt="score" data={trendRows(period, data, { stress: (d) => d.stressAvg })} series={[{ key: 'stress', name: 'Average stress', color: C.stress }]} />
          <ChartCard title="Blood oxygen" subtitle={`${period.avgWord} average SpO₂, %`} source="garmin" kind="line" fmt="score" data={trendRows(period, data, { spo2: (d) => d.spo2 })} series={[{ key: 'spo2', name: 'SpO₂', color: 'var(--s1)' }]} />
        </Grid>
      </Section>

      <Section title="Body" hint="From your Garmin Index scale. The latest reading each day.">
        <Grid>
          <Kpi label="Weight" value={weight.now ? fmtOne(weight.now.value) : null} unit="kg" sub={weighed(weight)} delta={weight.moved} spark={weight.spark} color="var(--s7)" source="garmin" />
          <Kpi label="Body fat" value={fat.now ? fmtOne(fat.now.value) : null} unit="%" sub={weighed(fat)} delta={fat.moved} spark={fat.spark} color="var(--s2)" source="garmin" />
          <Kpi label="Muscle mass" value={muscle.now ? fmtOne(muscle.now.value) : null} unit="kg" sub={weighed(muscle)} delta={muscle.moved} spark={muscle.spark} color="var(--s3)" source="garmin" />
          <Kpi label="BMI" value={bmi.now ? fmtOne(bmi.now.value) : null} sub={weighed(bmi)} delta={bmi.moved} spark={bmi.spark} color="var(--s1)" source="garmin" />
        </Grid>
        <div className="mt-4">
          <Grid cols={2}>
            <ChartCard title="Weight" subtitle={period.weeklyTrend ? `${period.avgLabel}, kg` : 'Each weigh-in, kg'} source="garmin" kind="line" fmt="kg" connectGaps data={trendRows(period, data, { w: (d) => d.weightKg })} series={[{ key: 'w', name: 'Weight', color: 'var(--s7)' }]} />
            <ChartCard title="Body fat" subtitle={period.weeklyTrend ? `${period.avgLabel}, %` : 'Each weigh-in, %'} source="garmin" kind="line" fmt="pct" connectGaps data={trendRows(period, data, { f: (d) => d.bodyFatPct })} series={[{ key: 'f', name: 'Body fat', color: 'var(--s2)' }]} />
          </Grid>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Body fat and muscle mass are the scale&apos;s own estimates from a small electrical current, and can shift with
          hydration and time of day. Trends over weeks are more reliable than any single reading.
        </p>
      </Section>

      <Section title="Other sports" hint="Everything except running and strength">
        <ChartCard
          title="Time by sport"
          subtitle={`Hours per ${period.bucketNoun}`}
          source="garmin"
          kind="bar"
          stacked
          fmt="hours"
          data={bucketRows(period, data, Object.fromEntries(otherSports.map((s) => [s, { filter: (a: Activity) => a.sport === s, value: (a: Activity) => a.durationH }])))}
          series={otherSports.map((s) => ({ key: s, name: SPORT_LABEL[s], color: SPORT_COLOR[s] }))}
        />
        <div className="mt-4">
          <ActivityTable activities={others.slice(0, 20)} empty={`No other activities in ${period.range === 'all' ? 'your history' : period.title.startsWith('last') ? `the ${period.title}` : period.title}`} />
        </div>
      </Section>
    </>
  )
}
