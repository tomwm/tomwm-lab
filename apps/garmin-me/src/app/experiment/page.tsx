import { Everest } from '@/components/experiments/Everest'
import { Journey } from '@/components/experiments/Journey'
import { PaceHeart } from '@/components/experiments/PaceHeart'
import { YearPixels, type PixelDay, type PixelMetric } from '@/components/experiments/YearPixels'
import { Shell, type Ctx, type PageProps } from '@/components/Shell'
import { addDays, eachDay, fmtFull, fmtMonth, mondayOf, today } from '@/lib/dates'

export const dynamic = 'force-dynamic'

export default function Page({ searchParams }: PageProps) {
  return (
    <Shell title="Experiment" searchParams={searchParams} allTime>
      {(ctx) => <Experiments {...ctx} />}
    </Shell>
  )
}

const METRICS: PixelMetric[] = [
  { key: 'train', label: 'Training', fmt: 'hours', source: 'garmin', hint: 'Total activity time that day' },
  { key: 'sleep', label: 'Sleep score', fmt: 'score', source: 'garmin', hint: "Garmin's score for the night before" },
  { key: 'steps', label: 'Steps', fmt: 'int', source: 'garmin', hint: 'Steps that day' },
  { key: 'stress', label: 'Stress', fmt: 'score', source: 'garmin', hint: 'Average stress, 0–100 (more colour is more stress)' },
]

function Experiments({ data }: Ctx) {
  const end = today()
  const days = [...data.days.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
  const since = days.find((d) => d.distanceKm !== null || d.climbM !== null)?.date ?? null

  const walked = days.filter((d) => d.distanceKm !== null).map((d) => ({ date: d.date, km: d.distanceKm! }))
  const climbed = days.filter((d) => d.climbM !== null).map((d) => ({ date: d.date, m: d.climbM! }))
  const runs = data.activities.filter((a) => a.sport === 'running' && a.distanceKm !== null).map((a) => ({ date: a.date, km: a.distanceKm! }))

  // 53 Monday-first weeks ending this week.
  const trainByDay = new Map<string, number>()
  for (const a of data.activities) trainByDay.set(a.date, (trainByDay.get(a.date) ?? 0) + a.durationH)
  const start = addDays(mondayOf(end), -52 * 7)
  const weeks: PixelDay[][] = []
  const months: { col: number; label: string }[] = []
  eachDay(start, addDays(mondayOf(end), 6)).forEach((date, i) => {
    if (i % 7 === 0) {
      weeks.push([])
      const prev = addDays(date, -7)
      if (i === 0 || prev.slice(0, 7) !== date.slice(0, 7)) months.push({ col: i / 7, label: fmtMonth(date) })
    }
    const d = data.days.get(date)
    weeks[weeks.length - 1].push({
      date,
      full: fmtFull(date),
      future: date > end,
      v: { train: trainByDay.get(date) ?? null, sleep: d?.sleepScore ?? null, steps: d?.steps ?? null, stress: d?.stressAvg ?? null },
    })
  })
  // Drop a month label that would collide with the next one.
  const monthLabels = months.filter((m, i) => i === months.length - 1 || months[i + 1].col - m.col >= 3)

  const runDots = data.activities
    .filter((a) => a.sport === 'running' && a.avgHr !== null && a.paceSecPerKm !== null && a.distanceKm !== null)
    .map((a) => ({ date: a.date, name: a.name, when: fmtFull(a.date), hr: a.avgHr!, pace: a.paceSecPerKm!, km: a.distanceKm! }))

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="xl:col-span-2">
        <Journey daily={walked} runs={runs} today={end} />
      </div>
      <Everest daily={climbed} today={end} />
      <PaceHeart runs={runDots} today={end} loadedFrom={since} />
      <div className="xl:col-span-2">
        <YearPixels weeks={weeks} months={monthLabels} metrics={METRICS} />
      </div>
    </div>
  )
}
