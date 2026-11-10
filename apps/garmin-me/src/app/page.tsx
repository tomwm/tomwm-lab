import { ActivityTable } from '@/components/ActivityTable'
import { ChartCard } from '@/components/ChartCard'
import { Kpi } from '@/components/Kpi'
import { Grid, Section, Shell, type Ctx, type PageProps } from '@/components/Shell'
import { C, SPORT_COLOR } from '@/lib/colors'
import { fmtDay, today } from '@/lib/dates'
import { fmtHours, fmtInt, fmtOne } from '@/lib/format'
import { SPORT_LABEL, SPORTS, type Day } from '@/lib/garmin/normalize'
import { actStat, actsIn, bucketRows, dayStat, latest, makeDelta, trendRows } from '@/lib/metrics'
import { label } from '@/lib/text'

export const dynamic = 'force-dynamic'

export default function Page({ searchParams }: PageProps) {
  return (
    <Shell title="Overview" searchParams={searchParams}>
      {(ctx) => <Overview {...ctx} />}
    </Shell>
  )
}

function Overview({ period, data }: Ctx) {
  const now = data.days.get(today())
  const vsAvg = `vs ${period.adj} average`

  /** A "last night / today" card: today's value against the period average. */
  const todayCard = (pick: (d: Day) => number | null, fmt: (v: number) => string, fmtDiff: (v: number) => string, higherIsBetter: boolean, flatBelow: number) => {
    const stat = dayStat(period, data, pick, { fmtDiff, higherIsBetter })
    const v = now ? pick(now) : null
    const last = v === null ? latest(data, pick) : null
    return {
      value: v === null ? null : fmt(v),
      delta: v === null || stat.n < 3 ? null : makeDelta(v, stat.value, fmtDiff, higherIsBetter, vsAvg, flatBelow),
      missing: v === null ? (last ? `Not recorded. Last: ${fmt(last.value)} on ${fmtDay(last.date)}` : 'Not recorded') : undefined,
      spark: stat.spark,
    }
  }

  const sleep = todayCard((d) => d.sleepH, fmtHours, fmtHours, true, 5 / 60)
  const hrv = todayCard((d) => d.hrv, fmtInt, (v) => `${fmtInt(v)} ms`, true, 0.5)
  const rhr = todayCard((d) => d.restingHr, fmtInt, (v) => `${fmtInt(v)} bpm`, false, 0.5)
  const bbPick = (d: Day) => d.bbWake ?? d.bbHigh
  const bb = todayCard(bbPick, fmtInt, (v) => fmtInt(v), true, 0.5)

  const time = actStat(period, data, undefined, (a) => a.durationH, 'sum', { fmtDiff: fmtHours, higherIsBetter: null, flatBelow: 1 / 60 })
  const sessions = actStat(period, data, undefined, () => 1, 'sum', { fmtDiff: (v) => fmtInt(v), higherIsBetter: null })
  const runKm = actStat(period, data, (a) => a.sport === 'running', (a) => a.distanceKm, 'sum', { fmtDiff: (v) => `${fmtOne(v)} km`, higherIsBetter: null, flatBelow: 0.05 })
  const load = actStat(period, data, undefined, (a) => a.trainingLoad, 'sum', { fmtDiff: (v) => fmtInt(v), higherIsBetter: null, flatBelow: 0.5 })

  const base = latest(data, (d) => d.hrvBaseLow)
  const band = base && base.day.hrvBaseHigh !== null ? { low: base.value, high: base.day.hrvBaseHigh, label: "Garmin's balanced range for you" } : undefined

  return (
    <>
      <Section title="Recovery · last night" hint={fmtDay(today())}>
        <Grid>
          <Kpi
            label="Sleep"
            value={sleep.value}
            sub={sleep.missing ?? (now?.sleepScore != null ? `Score ${now.sleepScore} · ${label(now.sleepQuality) ?? ''}` : undefined)}
            delta={sleep.delta}
            spark={sleep.spark}
            color={C.sleep}
            source="garmin"
          />
          <Kpi label="Overnight HRV" value={hrv.value} unit="ms" sub={hrv.missing ?? (now?.hrvStatus && now.hrvStatus !== 'NONE' ? `Status: ${label(now.hrvStatus)}` : undefined)} delta={hrv.delta} spark={hrv.spark} color={C.hrv} source="garmin" />
          <Kpi label="Resting HR" value={rhr.value} unit="bpm" sub={rhr.missing} delta={rhr.delta} spark={rhr.spark} color={C.heart} source="garmin" />
          <Kpi
            label="Body Battery"
            value={bb.value}
            sub={bb.missing ?? (now?.bbWake != null ? 'At wake-up' : "Today's peak so far")}
            delta={bb.delta}
            spark={bb.spark}
            color={C.battery}
            source="garmin"
          />
        </Grid>
      </Section>

      <Section title={`Training · last ${period.label}`}>
        <Grid>
          <Kpi label="Active time" value={time.value ? fmtHours(time.value) : time.n ? '0m' : null} delta={time.delta} spark={time.spark} source="calc" />
          <Kpi label="Sessions" value={fmtInt(sessions.value ?? 0)} delta={sessions.delta} spark={sessions.spark} source="calc" />
          <Kpi label="Run distance" value={fmtOne(runKm.value ?? 0)} unit="km" delta={runKm.delta} spark={runKm.spark} color={SPORT_COLOR.running} source="calc" />
          <Kpi label="Training load" value={load.n ? fmtInt(load.value ?? 0) : null} sub="Sum of Garmin's per-session load" delta={load.delta} spark={load.spark} source="calc" />
        </Grid>
      </Section>

      <Section title="Training and recovery">
        <Grid cols={2}>
          <ChartCard
            title="Training time by sport"
            subtitle={`Hours per ${period.bucketNoun}`}
            source="calc"
            kind="bar"
            stacked
            fmt="hours"
            data={bucketRows(period, data, Object.fromEntries(SPORTS.map((s) => [s, { filter: (a) => a.sport === s, value: (a) => a.durationH }])))}
            series={SPORTS.map((s) => ({ key: s, name: SPORT_LABEL[s], color: SPORT_COLOR[s] }))}
          />
          <ChartCard
            title="Overnight HRV"
            subtitle={period.weeklyTrend ? 'Weekly average, ms' : 'Nightly average, ms'}
            source="garmin"
            kind="line"
            fmt="ms"
            data={trendRows(period, data, { hrv: (d) => d.hrv })}
            series={[{ key: 'hrv', name: 'HRV', color: C.hrv }]}
            band={band}
          />
          <ChartCard
            title="Sleep duration"
            subtitle={period.weeklyTrend ? 'Weekly average per night' : 'Per night (date you woke up)'}
            source="garmin"
            kind="bar"
            fmt="hours"
            data={trendRows(period, data, { sleep: (d) => d.sleepH })}
            series={[{ key: 'sleep', name: 'Sleep', color: C.sleep }]}
          />
          <ChartCard
            title="Resting heart rate"
            subtitle={period.weeklyTrend ? 'Weekly average, bpm' : 'Daily, bpm'}
            source="garmin"
            kind="line"
            fmt="bpm"
            data={trendRows(period, data, { rhr: (d) => d.restingHr })}
            series={[{ key: 'rhr', name: 'Resting HR', color: C.heart }]}
          />
        </Grid>
      </Section>

      <Section title="Recent activities">
        <ActivityTable activities={actsIn(data, period.start, period.end).slice(0, 8)} />
      </Section>
    </>
  )
}
