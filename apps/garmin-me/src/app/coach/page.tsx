import { Coach } from '@/components/coach/Coach'
import { Shell, type PageProps } from '@/components/Shell'
import { storedInsights, storedWorkout } from '@/lib/ai/coach'
import { getProvider } from '@/lib/ai/provider'
import { loadData } from '@/lib/data'
import { today } from '@/lib/dates'
import { planWeek } from '@/lib/plan'
import { getProfile } from '@/lib/ai/profile'
import { getTrainingPlan, weekVsPlan } from '@/lib/trainingPlan'
import { diffDays } from '@/lib/dates'
import { SPORT_LABEL } from '@/lib/garmin/normalize'

export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: PageProps) {
  const ai = getProvider()
  const status = await ai.status()
  const data = loadData()
  const week = planWeek(data, today())
  const tp = getTrainingPlan()
  const profile = getProfile()
  const wv = tp ? weekVsPlan(data, tp, today(), today()) : null
  const todayPlan = tp?.days.get(today())
  const trainingWeek = wv
    ? {
        raceName: profile.raceName ?? null,
        weeksToRace: profile.marathon ? Math.max(0, Math.round(diffDays(today(), profile.marathon) / 7)) : null,
        weekNumber: todayPlan?.week ?? wv.week?.week ?? null,
        totalWeeks: tp!.weeks.length || null,
        phase: wv.phase,
        note: wv.week ? [wv.week.runNote, wv.week.crossNote].filter(Boolean).join(' · ') : null,
        totals: wv.totals,
        days: wv.days.map((d) => ({
          date: d.date,
          items: d.items,
          actual: d.actual.map((a) => ({
            label: d.strengthMatch[a.id] ?? SPORT_LABEL[a.sport],
            minutes: Math.round(a.durationH * 60),
            km: a.distanceKm,
          })),
        })),
      }
    : null
  return (
    <Shell
      title="Coach"
      searchParams={searchParams}
      allTime
      subtitle={`Suggestions and answers from ${ai.label}, based on your data. Nothing leaves your computer.`}
    >
      {() => (
        <Coach
          today={today()}
          model={ai.label}
          problem={status.ok ? null : status.reason}
          initialWorkout={storedWorkout()}
          initialInsights={storedInsights()}
          trainingWeek={trainingWeek}
          week={{ weekStart: week.weekStart, next: week.next?.key ?? null, extra: week.extra.length, sessions: week.sessions.map((s) => ({ ...s.session, done: s.done })) }}
        />
      )}
    </Shell>
  )
}
