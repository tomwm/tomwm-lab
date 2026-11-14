import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useApp, useContentIndex } from '@/app/AppContext'
import { exposedGroupsAt, historyFor } from '@/storage/repo'
import { QuestionCard } from '@/features/practice/QuestionCard'
import { Badge, Breadcrumb, Card, EmptyState, Loading, Notice, PageHeader } from '@/ui/primitives'
import { describeInterval } from '@/domain/review'
import { formatDuration } from '@/domain/timing'
import { SKILL_BY_ID } from '@/content/skills'
import { isInteractive, quarantineReasons } from '@/domain/eligibility'
import { AttemptKindBadge } from '@/ui/status'

/**
 * One question, reached from any skill that references it. The history shown
 * here is the canonical history for the whole duplicate group, so opening the
 * same question through two skills never produces two separate records.
 */
export function QuestionPage() {
  const { questionId } = useParams<{ questionId: string }>()
  const content = useContentIndex()
  const { prefs } = useApp()

  const question = questionId ? content.questionById.get(questionId) : undefined
  const history = useLiveQuery(
    () => (question ? historyFor(question) : Promise.resolve(null)),
    [question?.id],
    null,
  )

  // Snapshot the groups already met *before* this page opened. Opening the
  // question here is itself an exposure, but it must not disqualify the very
  // attempt the learner is about to make — only having met it earlier does.
  const [exposedBefore, setExposedBefore] = useState<string[] | null>(null)
  useEffect(() => {
    let cancelled = false
    setExposedBefore(null)
    void exposedGroupsAt(Date.now()).then((groups) => {
      if (!cancelled) setExposedBefore(groups)
    })
    return () => {
      cancelled = true
    }
  }, [questionId])

  if (!question) return <EmptyState title="Unknown question">That question id does not exist.</EmptyState>

  const skill = SKILL_BY_ID.get(question.primarySkillId)
  const component = content.components.find((c) => c.id === question.componentId)
  const alsoTrains = content.skills.filter((s) => question.secondaryTags.includes(s.id))

  if (!isInteractive(question)) {
    const reasons = question.quarantineReason
      ? [question.quarantineReason]
      : quarantineReasons(question)
    return (
      <div>
        <Breadcrumb
          trail={[
            { label: 'Library', to: '/library' },
            ...(component ? [{ label: component.name, to: `/library/component/${component.id}` }] : []),
            ...(skill ? [{ label: skill.title, to: `/library/skill/${skill.id}` }] : []),
            { label: question.id },
          ]}
        />
        <PageHeader title={question.id} lead="This question cannot be practised in the app." />
        <Notice tone="warning" title="Held back from practice">
          <ul className="mt-1 grid list-disc gap-1 pl-5">
            {reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <p className="mt-2">
            Items in this state are kept rather than deleted, so the coverage report can say exactly
            what is missing. They never enter scored practice.
          </p>
        </Notice>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb
        trail={[
          { label: 'Library', to: '/library' },
          ...(component ? [{ label: component.name, to: `/library/component/${component.id}` }] : []),
          ...(skill ? [{ label: skill.title, to: `/library/skill/${skill.id}` }] : []),
          { label: question.id },
        ]}
      />

      {alsoTrains.length > 0 && (
        <Notice tone="info" className="mb-4">
          This question also appears under {alsoTrains.map((s) => s.title).join(', ')}. It is stored
          once and has one history, whichever route you reach it by. It is scored under{' '}
          {skill?.title ?? question.primarySkillId} only, so no report counts it twice.
        </Notice>
      )}

      {exposedBefore === null ? (
        <Loading label="Opening question" />
      ) : (
        <QuestionCard
          question={question}
          mode="learning"
          sessionId={null}
          exposedGroupsAtStart={exposedBefore}
          timing={prefs.timing}
        />
      )}

      {history && (history.attempts.length > 0 || history.exposures.length > 0) && (
        <Card className="mt-4 p-4">
          <h2 className="text-sm font-semibold">History for this question</h2>
          {history.review && (
            <p className="mt-1 text-sm text-foreground-muted">
              Next review {describeInterval(history.review.stage)} — due{' '}
              {new Date(history.review.dueAt).toLocaleDateString('en-GB')}.
            </p>
          )}
          {history.attempts.length === 0 ? (
            <p className="mt-2 text-sm text-foreground-muted">
              Seen {history.exposures.length} {history.exposures.length === 1 ? 'time' : 'times'}, never
              answered.
            </p>
          ) : (
            <ol className="mt-2 grid list-none gap-1.5 text-sm">
              {history.attempts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2">
                  <span className="tabular-nums text-foreground-subtle">
                    {new Date(a.submittedAt).toLocaleDateString('en-GB')}
                  </span>
                  <Badge
                    tone={
                      a.outcome === 'correct' ? 'success' : a.outcome === 'incorrect' ? 'danger' : 'warning'
                    }
                  >
                    {a.outcome === 'unscored' ? 'Not scored' : a.outcome}
                  </Badge>
                  <AttemptKindBadge attempt={a} />
                  <span className="text-foreground-subtle">{formatDuration(a.durationMs)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}
    </div>
  )
}
