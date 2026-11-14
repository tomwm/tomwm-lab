import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useContentIndex } from '@/app/AppContext'
import { db } from '@/storage/db'
import { getSession } from '@/storage/repo'
import { scoreModule } from '@/domain/marking'
import { formatDuration } from '@/domain/timing'
import { describeInterval } from '@/domain/review'
import type { Attempt, Essay, Question } from '@/domain/types'
import { Badge, Breadcrumb, ButtonLink, Card, EmptyState, Loading, Notice, PageHeader } from '@/ui/primitives'
import { SKILL_BY_ID } from '@/content/skills'
import { AttemptKindBadge } from '@/ui/status'
import { finaliseSession } from './finalise'

/**
 * Results for a finished session. After a standalone module the review opens
 * immediately; after a full rehearsal nothing is shown until every stage has
 * ended, which by definition has happened by the time this page renders.
 */
export function SessionSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const content = useContentIndex()

  const session = useLiveQuery(
    () => (sessionId ? getSession(sessionId) : Promise.resolve(undefined)),
    [sessionId],
    undefined,
  )
  const attempts =
    useLiveQuery(
      () =>
        sessionId
          ? db.attempts.where('sessionId').equals(sessionId).sortBy('submittedAt')
          : Promise.resolve([] as Attempt[]),
      [sessionId],
      [] as Attempt[],
    ) ?? []
  const reviews = useLiveQuery(() => db.reviewStates.toArray(), [], []) ?? []
  const essay = useLiveQuery<Essay | undefined, undefined>(
    () =>
      sessionId
        ? db.essays.where('sessionId').equals(sessionId).first()
        : Promise.resolve(undefined),
    [sessionId],
    undefined,
  )

  const reviewByGroup = useMemo(() => new Map(reviews.map((r) => [r.groupId, r])), [reviews])

  // Belt and braces: if a module ended while this tab was closed, make sure its
  // answers have become attempt records before anything is reported.
  useEffect(() => {
    if (sessionId) void finaliseSession(sessionId, content)
  }, [sessionId, content])

  if (session === undefined) return <Loading label="Opening results" />
  if (!session) return <EmptyState title="Session not found">That session no longer exists.</EmptyState>

  const stageResults = session.stages
    .filter((s) => s.kind === 'module')
    .map((stage) => {
      const questions = stage.itemIds
        .map((id) => content.questionById.get(id))
        .filter((q): q is Question => Boolean(q))
      return {
        stage,
        questions,
        score: scoreModule(questions, session.answers, session.exposedGroupsAtStart),
      }
    })

  const fresh = attempts.filter((a) => a.freshFirstAttempt)
  const freshCorrect = fresh.filter((a) => a.outcome === 'correct').length
  const repeats = attempts.filter((a) => !a.freshFirstAttempt && a.outcome !== 'unscored')
  const repeatCorrect = repeats.filter((a) => a.outcome === 'correct').length
  const unscored = attempts.filter((a) => a.outcome === 'unscored').length

  const isTimed = session.timing.kind === 'strict'
  const anyExpired = session.stages.some((s) => s.status === 'expired')

  return (
    <div>
      <Breadcrumb trail={[{ label: 'Practice', to: '/practice' }, { label: 'Results' }]} />
      <PageHeader
        title="Session results"
        lead={`${describeMode(session.mode)} · ${new Date(session.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`}
        actions={<ButtonLink to="/practice" variant="secondary">Back to practice</ButtonLink>}
      />

      {anyExpired && (
        <Notice tone="warning" className="mb-4">
          At least one stage ran out of time. Anything unanswered when the clock stopped was recorded
          as unanswered.
        </Notice>
      )}

      {session.mode === 'full-rehearsal' && (
        <Notice tone="info" className="mb-4">
          This was TARA-format practice assembled from the material available in this app. It is not an
          official paper, and its difficulty and skill distribution are not calibrated to the real
          test. There is no scaled score here because none can honestly be produced.
        </Notice>
      )}

      {isTimed && stageResults.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {stageResults.map(({ stage, score }) => (
            <Card key={stage.id} className="p-4">
              <p className="text-sm font-semibold">{stage.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {score.correct}
                <span className="text-lg text-foreground-subtle">/{score.total}</span>
              </p>
              <dl className="mt-2 grid gap-1 text-sm">
                <Row label="Incorrect">{score.incorrect}</Row>
                <Row label="Unanswered">{score.unanswered}</Row>
                {score.unscored > 0 && <Row label="No verified key">{score.unscored}</Row>}
                <Row label="Previously seen">{score.previouslyExposed}</Row>
              </dl>
              {stage.status === 'expired' && <Badge tone="warning" className="mt-2">Ran out of time</Badge>}
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4">
        <h2 className="text-sm font-semibold">What this tells you</h2>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Fresh first attempts">
            {fresh.length ? `${freshCorrect}/${fresh.length}` : 'none'}
          </Row>
          <Row label="Repeat practice">
            {repeats.length ? `${repeatCorrect}/${repeats.length}` : 'none'}
          </Row>
          <Row label="Revealed or unscored">{unscored}</Row>
          <Row label="Timing">
            {session.timing.kind === 'strict'
              ? `Strict${session.timing.multiplier !== 1 ? ` ×${session.timing.multiplier}` : ''}`
              : 'Untimed'}
          </Row>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-foreground-subtle">
          Only fresh first attempts measure whether you can do this on a question you have not met.
          Repeat practice shows retention of a specific item and never raises your fresh accuracy.
        </p>
      </Card>

      {attempts.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold">Question by question</h2>
          <ul className="grid list-none gap-2">
            {attempts.map((attempt) => {
              const question = content.questionById.get(attempt.questionId)
              const review = reviewByGroup.get(attempt.duplicateGroupId)
              return (
                <Card as="li" key={attempt.id} className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        attempt.outcome === 'correct'
                          ? 'success'
                          : attempt.outcome === 'incorrect'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {attempt.outcome === 'unscored' ? 'Not scored' : attempt.outcome}
                    </Badge>
                    <Link
                      to={`/library/question/${attempt.questionId}`}
                      className="text-sm font-medium underline underline-offset-2"
                    >
                      {attempt.questionId}
                    </Link>
                    <span className="text-xs text-foreground-subtle">
                      {SKILL_BY_ID.get(attempt.primarySkillIdSnapshot)?.title ?? attempt.primarySkillIdSnapshot}
                    </span>
                    <AttemptKindBadge attempt={attempt} />
                    {question?.provenance === 'app-fixture' && <Badge tone="warning">fixture</Badge>}
                    <span className="ml-auto text-xs tabular-nums text-foreground-subtle">
                      {attempt.durationMs > 0 ? formatDuration(attempt.durationMs) : 'time not recorded'}
                    </span>
                  </div>
                  {review && (
                    <p className="mt-1.5 text-xs text-foreground-subtle">
                      Back for review {describeInterval(review.stage)} ·{' '}
                      {new Date(review.dueAt).toLocaleDateString('en-GB')}
                    </p>
                  )}
                  {attempt.errorLabels.length > 0 && (
                    <p className="mt-1 text-xs text-foreground-muted">
                      You tagged this: {attempt.errorLabels.join(', ')}
                    </p>
                  )}
                </Card>
              )
            })}
          </ul>
        </section>
      )}

      {essay && (
        <Card className="mt-5 p-4">
          <h2 className="text-sm font-semibold">Writing</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {essay.revisions.length > 0
              ? `Submitted ${essay.revisions.at(-1)?.wordCount} words${essay.revisions.at(-1)?.truncated ? ' (truncated at the limit; the full text is archived)' : ''}.`
              : 'Draft saved, not submitted.'}
          </p>
          <p className="mt-2 text-xs text-foreground-subtle">
            The essay is not scored here, and the real test does not score it either — it is passed to
            participating universities unscored. Use the checklist on the prompt to review it.
          </p>
          <div className="mt-3">
            <ButtonLink to={`/writing/essay/${essay.id}`} variant="secondary" size="sm">
              Open the essay
            </ButtonLink>
          </div>
        </Card>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-foreground-subtle">{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  )
}

function describeMode(mode: string): string {
  const map: Record<string, string> = {
    quick: 'Quick set',
    custom: 'Custom set',
    diagnostic: 'Short diagnostic',
    review: 'Review set',
    'timed-module': 'Timed module',
    'full-rehearsal': 'Full rehearsal',
    writing: 'Writing',
  }
  return map[mode] ?? mode
}
