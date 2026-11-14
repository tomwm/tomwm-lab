import { BodyMap } from '@/components/BodyMap'
import { Kpi, SourceTag } from '@/components/Kpi'
import { Grid, Section, Shell, type Ctx, type PageProps } from '@/components/Shell'
import { C, SPORT_COLOR } from '@/lib/colors'
import { addDays } from '@/lib/dates'
import { fmtHours, fmtInt, fmtOne, fmtPace } from '@/lib/format'
import { SPORT_LABEL, type Activity, type Day } from '@/lib/garmin/normalize'
import { actsIn, dayList, makeDelta, mean, nums, sum } from '@/lib/metrics'
import { exercisesByMuscle, MUSCLE_LABEL, muscleWork, targetOf } from '@/lib/muscles'
import { label } from '@/lib/text'

export const dynamic = 'force-dynamic'

export default function Page({ searchParams }: PageProps) {
  return (
    <Shell title="Days" searchParams={searchParams} dayView>
      {(ctx) => <DayView {...ctx} />}
    </Shell>
  )
}

const ZONE_NAMES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5']
const pretty = (key: string) => {
  const s = key.replace(/_/g, ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function DayView({ period, data }: Ctx) {
  const date = period.start
  const day = data.days.get(date)
  const before = dayList(data, addDays(date, -30), addDays(date, -1))
  const sessions = actsIn(data, date, date).sort((a, b) => (a.startLocal < b.startLocal ? -1 : 1))

  /** A health figure for this day, compared with the 30 days before it. */
  const health = (pick: (d: Day) => number | null, fmtDiff: (v: number) => string, higherIsBetter: boolean | null, flatBelow = 0.5) => {
    const v = day ? pick(day) : null
    const avg = mean(nums(before.map(pick)))
    return {
      v,
      delta: v === null ? null : makeDelta(v, avg, fmtDiff, higherIsBetter, 'vs 30 days before', flatBelow),
      spark: [...before, day].map((d) => (d ? pick(d) : null)),
    }
  }
  const sleep = health((d) => d.sleepH, fmtHours, true, 5 / 60)
  const hrv = health((d) => d.hrv, (v) => `${fmtInt(v)} ms`, true)
  const rhr = health((d) => d.restingHr, (v) => `${fmtInt(v)} bpm`, false)
  const bb = health((d) => d.bbWake ?? d.bbHigh, (v) => fmtInt(v), true)
  const steps = health((d) => d.steps, (v) => fmtInt(v), true, 50)
  const stress = health((d) => d.stressAvg, (v) => fmtInt(v), false)
  const kcal = health((d) => d.activeKcal, (v) => `${fmtInt(v)} kcal`, null, 5)
  const weight = day?.weightKg ?? null
  const noHealth = [sleep, hrv, rhr, bb, steps, stress, kcal].every((h) => h.v === null)

  const totalH = sum(sessions.map((a) => a.durationH))
  const totalKm = sum(nums(sessions.map((a) => a.distanceKm)))
  const strength = sessions.filter((a) => a.sport === 'strength')
  const work = muscleWork(strength)

  return (
    <>
      <Section title="Sleep, recovery and health" hint={noHealth ? 'Nothing recorded by the watch this day' : 'Compared with the 30 days before'}>
        <Grid>
          <Kpi
            label="Sleep"
            value={sleep.v !== null ? fmtHours(sleep.v) : null}
            sub={day?.sleepScore != null ? `Score ${day.sleepScore} · ${label(day.sleepQuality) ?? ''} · night before` : sleep.v !== null ? 'Night before' : undefined}
            delta={sleep.delta}
            spark={sleep.spark}
            color={C.sleep}
            source="garmin"
          />
          <Kpi label="Overnight HRV" value={hrv.v !== null ? fmtInt(hrv.v) : null} unit="ms" sub={day?.hrvStatus && day.hrvStatus !== 'NONE' ? `Status: ${label(day.hrvStatus)}` : undefined} delta={hrv.delta} spark={hrv.spark} color={C.hrv} source="garmin" />
          <Kpi label="Resting HR" value={rhr.v !== null ? fmtInt(rhr.v) : null} unit="bpm" delta={rhr.delta} spark={rhr.spark} color={C.heart} source="garmin" />
          <Kpi label="Body Battery" value={bb.v !== null ? fmtInt(bb.v) : null} sub={day?.bbWake != null ? 'At wake-up' : bb.v !== null ? "Day's peak" : undefined} delta={bb.delta} spark={bb.spark} color={C.battery} source="garmin" />
          <Kpi label="Steps" value={steps.v !== null ? fmtInt(steps.v) : null} sub={day?.stepGoal ? `Goal ${fmtInt(day.stepGoal)}` : undefined} delta={steps.delta} spark={steps.spark} color={C.steps} source="garmin" />
          <Kpi label="Stress" value={stress.v !== null ? fmtInt(stress.v) : null} sub={stress.v !== null ? 'Average, 0–100' : undefined} delta={stress.delta} spark={stress.spark} color={C.stress} source="garmin" />
          <Kpi label="Active calories" value={kcal.v !== null ? fmtInt(kcal.v) : null} unit="kcal" delta={kcal.delta} spark={kcal.spark} color="var(--s8)" source="garmin" />
          <Kpi
            label="Weight"
            value={weight !== null ? fmtOne(weight) : null}
            unit="kg"
            sub={weight !== null ? [day?.bodyFatPct != null ? `${fmtOne(day.bodyFatPct)}% body fat` : null, day?.muscleKg != null ? `${fmtOne(day.muscleKg)} kg muscle` : null].filter(Boolean).join(' · ') || undefined : 'No weigh-in this day'}
            color="var(--s7)"
            source="garmin"
          />
        </Grid>
      </Section>

      <Section
        title="Training"
        hint={sessions.length ? `${sessions.length} session${sessions.length === 1 ? '' : 's'} · ${fmtHours(totalH)}${totalKm > 0 ? ` · ${fmtOne(totalKm)} km` : ''}` : undefined}
      >
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">No activities recorded this day</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {sessions.map((a) => <SessionCard key={a.id} a={a} />)}
          </div>
        )}
      </Section>

      {work.placed > 0 && (
        <Section title="Muscles worked">
          <BodyMap sets={work.sets} placed={work.placed} unplaced={work.unplaced} rangeTitle="this day" done={exercisesByMuscle(strength)} />
        </Section>
      )}
    </>
  )
}

function SessionCard({ a }: { a: Activity }) {
  const pace = a.paceSecPerKm !== null && (a.sport === 'running' || a.sport === 'walking')
  const stats: [string, string | null][] = [
    ['Time', fmtHours(a.durationH)],
    ['Distance', a.distanceKm !== null ? `${fmtOne(a.distanceKm)} km` : null],
    ['Pace', pace ? `${fmtPace(a.paceSecPerKm!)} /km` : null],
    ['Avg HR', a.avgHr !== null ? `${fmtInt(a.avgHr)} bpm` : null],
    ['Max HR', a.maxHr !== null ? `${fmtInt(a.maxHr)} bpm` : null],
    ['Climb', a.elevGainM ? `${fmtInt(a.elevGainM)} m` : null],
    ['Cadence', a.cadence !== null ? `${fmtInt(a.cadence)} spm` : null],
    ['Load', a.trainingLoad !== null ? fmtInt(a.trainingLoad) : null],
    ['Calories', a.calories !== null ? `${fmtInt(a.calories)} kcal` : null],
  ]
  const shown = stats.filter((s): s is [string, string] => s[1] !== null)
  const zones = a.zonesSec && sum(a.zonesSec) > 0 ? a.zonesSec : null
  const zTotal = zones ? sum(zones) : 0
  const exercises = a.exercises.filter((e) => e.sets > 0 || e.reps > 0)

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 md:p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SPORT_COLOR[a.sport] }} />
            {SPORT_LABEL[a.sport]} · {a.startLocal.slice(11, 16)}
            {a.location && ` · ${a.location}`}
          </div>
          <h3 className="mt-1 truncate text-base font-semibold tracking-tight">{a.name}</h3>
        </div>
        <SourceTag source="garmin" />
      </header>

      <dl className="grid grid-cols-3 gap-x-4 gap-y-3">
        {shown.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {zones && (
        <div className="mt-4">
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={zones.map((z, i) => `${ZONE_NAMES[i]}: ${fmtHours(z / 3600)}`).join(', ')}>
            {zones.map((z, i) => (z > 0 ? <div key={i} title={`${ZONE_NAMES[i]}: ${fmtHours(z / 3600)}`} style={{ width: `${(z / zTotal) * 100}%`, background: `var(--z${i + 1})` }} /> : null))}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Heart-rate zones · mostly {ZONE_NAMES[zones.indexOf(Math.max(...zones))].toLowerCase()}
          </p>
        </div>
      )}

      {a.sport === 'strength' && exercises.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1.5 text-left font-medium">Exercise</th>
              <th className="py-1.5 text-left font-medium">Mainly works</th>
              <th className="py-1.5 text-right font-medium">Sets</th>
              <th className="py-1.5 text-right font-medium">Reps</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((e, i) => {
              const t = targetOf(e)
              return (
                <tr key={i} className="border-t border-line">
                  <td className={`py-1.5 ${t ? '' : 'text-muted'}`}>{t ? pretty(e.sub ?? e.category) : 'Not identified'}</td>
                  <td className="py-1.5 text-ink-2">{t ? t.main.map((m) => MUSCLE_LABEL[m]).join(', ') : '–'}</td>
                  <td className="py-1.5 text-right tabular-nums">{fmtInt(e.sets)}</td>
                  <td className="py-1.5 text-right tabular-nums">{fmtInt(e.reps)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </article>
  )
}
