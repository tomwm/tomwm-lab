import { SPORT_COLOR } from '@/lib/colors'
import { fmtDay, fmtWeekday } from '@/lib/dates'
import { fmtHours, fmtInt, fmtOne, fmtPace } from '@/lib/format'
import { SPORT_LABEL, type Activity } from '@/lib/garmin/normalize'

/** Compact list of sessions. Pace is only shown for sports where it means something. */
export function ActivityTable({ activities, empty = 'No activities in this range' }: { activities: Activity[]; empty?: string }) {
  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">{empty}</div>
    )
  }
  const th = 'px-3 py-2.5 text-right font-medium'
  const td = 'px-3 py-3 text-right tabular-nums'
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[32rem] text-sm">
        <thead className="text-xs text-muted">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Date</th>
            <th className="px-3 py-2.5 text-left font-medium">Activity</th>
            <th className={th}>Distance</th>
            <th className={th}>Time</th>
            <th className={th}>Pace</th>
            <th className={th}>Avg HR</th>
            <th className={`${th} pr-4`} title="Garmin's training load for the session">Load</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((a) => (
            <tr key={a.id} className="border-t border-line">
              <td className="whitespace-nowrap px-4 py-3 text-ink-2">
                <span className="text-muted">{fmtWeekday(a.date)}</span> {fmtDay(a.date)}
              </td>
              <td className="px-3 py-3">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SPORT_COLOR[a.sport] }} title={SPORT_LABEL[a.sport]} />
                  <span className="max-w-[14rem] truncate">{a.name}</span>
                </span>
              </td>
              <td className={td}>{a.distanceKm !== null ? `${fmtOne(a.distanceKm)} km` : <span className="text-muted">–</span>}</td>
              <td className={td}>{fmtHours(a.durationH)}</td>
              <td className={td}>
                {a.paceSecPerKm !== null && (a.sport === 'running' || a.sport === 'walking') ? `${fmtPace(a.paceSecPerKm)} /km` : <span className="text-muted">–</span>}
              </td>
              <td className={td}>{a.avgHr !== null ? fmtInt(a.avgHr) : <span className="text-muted">–</span>}</td>
              <td className={`${td} pr-4`}>{a.trainingLoad !== null ? fmtInt(a.trainingLoad) : <span className="text-muted">–</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
