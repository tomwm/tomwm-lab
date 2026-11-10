import { ChartCard } from '@/components/ChartCard'
import { Kpi } from '@/components/Kpi'
import { Grid, Section, Shell, type Ctx, type PageProps } from '@/components/Shell'
import { C } from '@/lib/colors'
import { diffDays } from '@/lib/dates'
import { fmtHours, fmtInt } from '@/lib/format'
import { dayStat, latest, trendRows } from '@/lib/metrics'

export const dynamic = 'force-dynamic'

export default function Page({ searchParams }: PageProps) {
  return (
    <Shell title="Recovery" searchParams={searchParams}>
      {(ctx) => <Recovery {...ctx} />}
    </Shell>
  )
}

function Recovery({ period, data }: Ctx) {
  const total = diffDays(period.start, period.end) + 1
  const hrv = dayStat(period, data, (d) => d.hrv, { fmtDiff: (v) => `${fmtInt(v)} ms`, higherIsBetter: true, flatBelow: 0.5 })
  const rhr = dayStat(period, data, (d) => d.restingHr, { fmtDiff: (v) => `${fmtInt(v)} bpm`, higherIsBetter: false, flatBelow: 0.5 })
  const sleep = dayStat(period, data, (d) => d.sleepH, { fmtDiff: fmtHours, higherIsBetter: true, flatBelow: 5 / 60 })
  const score = dayStat(period, data, (d) => d.sleepScore, { fmtDiff: (v) => fmtInt(v), higherIsBetter: true, flatBelow: 0.5 })
  const of = (n: number, noun: string) => `Recorded on ${n} of ${total} ${noun}`

  const base = latest(data, (d) => d.hrvBaseLow)
  const band = base && base.day.hrvBaseHigh !== null ? { low: base.value, high: base.day.hrvBaseHigh, label: "Garmin's balanced range for you" } : undefined
  const per = period.weeklyTrend ? 'Weekly average' : 'Nightly'
  const perDay = period.weeklyTrend ? 'Weekly average' : 'Daily'

  return (
    <>
      <Section title={`Averages · last ${period.label}`}>
        <Grid>
          <Kpi label="Overnight HRV" value={hrv.value !== null ? fmtInt(hrv.value) : null} unit="ms" sub={hrv.n ? of(hrv.n, 'nights') : undefined} delta={hrv.delta} spark={hrv.spark} color={C.hrv} source="calc" />
          <Kpi label="Resting HR" value={rhr.value !== null ? fmtInt(rhr.value) : null} unit="bpm" sub={rhr.n ? of(rhr.n, 'days') : undefined} delta={rhr.delta} spark={rhr.spark} color={C.heart} source="calc" />
          <Kpi label="Sleep" value={sleep.value !== null ? fmtHours(sleep.value) : null} sub={sleep.n ? of(sleep.n, 'nights') : undefined} delta={sleep.delta} spark={sleep.spark} color={C.sleep} source="calc" />
          <Kpi label="Sleep score" value={score.value !== null ? fmtInt(score.value) : null} sub={score.n ? of(score.n, 'nights') : undefined} delta={score.delta} spark={score.spark} color={C.sleep} source="calc" />
        </Grid>
      </Section>

      <Section title="Heart" hint="Gaps mean the watch recorded nothing">
        <Grid cols={2}>
          <ChartCard title="Overnight HRV" subtitle={`${per}, ms`} source="garmin" kind="line" fmt="ms" data={trendRows(period, data, { hrv: (d) => d.hrv })} series={[{ key: 'hrv', name: 'HRV', color: C.hrv }]} band={band} />
          <ChartCard title="Resting heart rate" subtitle={`${perDay}, bpm`} source="garmin" kind="line" fmt="bpm" data={trendRows(period, data, { rhr: (d) => d.restingHr })} series={[{ key: 'rhr', name: 'Resting HR', color: C.heart }]} />
        </Grid>
      </Section>

      <Section title="Sleep">
        <Grid cols={2}>
          <ChartCard
            title="Sleep stages"
            subtitle={period.weeklyTrend ? 'Weekly average per night' : 'Per night (date you woke up)'}
            source="garmin"
            kind="bar"
            stacked
            fmt="hours"
            data={trendRows(period, data, { deep: (d) => d.deepH, rem: (d) => d.remH, light: (d) => d.lightH, awake: (d) => d.awakeH })}
            series={[
              { key: 'deep', name: 'Deep', color: 'var(--s1)' },
              { key: 'rem', name: 'REM', color: 'var(--s2)' },
              { key: 'light', name: 'Light', color: 'var(--s3)' },
              { key: 'awake', name: 'Awake', color: 'var(--s4)' },
            ]}
          />
          <ChartCard title="Sleep score" subtitle={`${per}, out of 100`} source="garmin" kind="line" fmt="score" data={trendRows(period, data, { score: (d) => d.sleepScore })} series={[{ key: 'score', name: 'Sleep score', color: C.sleep }]} />
        </Grid>
      </Section>

      <Section title="Energy and stress">
        <Grid cols={2}>
          <ChartCard
            title="Body Battery"
            subtitle={`${perDay} high and low`}
            source="garmin"
            kind="line"
            fmt="score"
            data={trendRows(period, data, { high: (d) => d.bbHigh, low: (d) => d.bbLow })}
            series={[
              { key: 'high', name: 'Daily high', color: 'var(--s1)' },
              { key: 'low', name: 'Daily low', color: 'var(--s2)' },
            ]}
          />
          <ChartCard title="Stress" subtitle={`${perDay} average, 0–100`} source="garmin" kind="line" fmt="score" data={trendRows(period, data, { stress: (d) => d.stressAvg })} series={[{ key: 'stress', name: 'Average stress', color: C.stress }]} />
        </Grid>
      </Section>
    </>
  )
}
