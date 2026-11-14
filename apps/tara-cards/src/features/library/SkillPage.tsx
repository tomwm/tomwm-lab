import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useContentIndex } from '@/app/AppContext'
import { useAttempts, useExposedGroups, useReportableAttempts, useReviewStates } from '@/app/hooks'
import { groupBy, questionState, uniqueQuestionCount } from '@/app/questionState'
import { isInteractive } from '@/domain/eligibility'
import { EVIDENCE, statsForSkill } from '@/domain/aggregation'
import { formatDuration } from '@/domain/timing'
import { CardList, QuestionPreviewCard } from '@/ui/cards'
import {
  Badge,
  Breadcrumb,
  ButtonLink,
  Card,
  EmptyState,
  Fraction,
  Notice,
  PageHeader,
} from '@/ui/primitives'
import { StatusBadge } from '@/ui/status'
import { SOURCES } from '@/content/sources'

export function SkillPage() {
  const { skillId } = useParams<{ skillId: string }>()
  const content = useContentIndex()
  const allAttempts = useAttempts()
  const reportable = useReportableAttempts()
  const exposed = useExposedGroups()
  const reviews = useReviewStates()

  const skill = content.skills.find((s) => s.id === skillId)
  const component = content.components.find((c) => c.id === skill?.componentId)

  const attemptsByGroup = useMemo(() => groupBy(allAttempts, (a) => a.duplicateGroupId), [allAttempts])
  const reviewByGroup = useMemo(() => new Map(reviews.map((r) => [r.groupId, r])), [reviews])

  // A question belongs to one skill for scoring, but may be listed under
  // others for discovery. Secondary appearances are labelled, and they share
  // the primary skill's single canonical history.
  const primary = useMemo(
    () => content.questions.filter((q) => q.primarySkillId === skillId),
    [content.questions, skillId],
  )
  const secondary = useMemo(
    () =>
      content.questions.filter(
        (q) => q.primarySkillId !== skillId && skillId !== undefined && q.secondaryTags.includes(skillId),
      ),
    [content.questions, skillId],
  )
  const questions = useMemo(() => [...primary, ...secondary], [primary, secondary])
  const available = questions.filter(isInteractive)

  if (!skill || !component) {
    return <EmptyState title="Unknown skill">That skill does not exist.</EmptyState>
  }

  const stats = statsForSkill(reportable, skill.id)
  const isWriting = component.id === 'writing'

  return (
    <div>
      <Breadcrumb
        trail={[
          { label: 'Library', to: '/library' },
          { label: component.name, to: `/library/component/${component.id}` },
          { label: skill.title },
        ]}
      />
      <PageHeader
        title={skill.title}
        lead={
          <>
            {skill.summary}
            {skill.officialName && (
              <span className="mt-1 block text-xs text-foreground-subtle">
                In UAT-UK&rsquo;s question guide: {skill.officialName}
              </span>
            )}
          </>
        }
        actions={
          isWriting ? (
            <ButtonLink to="/writing">Open writing</ButtonLink>
          ) : available.length > 0 ? (
            <ButtonLink to={`/practice?skill=${skill.id}&start=1`}>Practise this skill</ButtonLink>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid gap-4">
          <Card className="p-4 sm:p-5">
            <h2 className="text-sm font-semibold">Method</h2>
            <ol className="mt-2 grid list-decimal gap-1.5 pl-5 text-sm leading-relaxed">
              {skill.method.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              Worked example
              <Badge tone="neutral">Written for this app</Badge>
            </h2>
            <p className="prose-reading mt-2 rounded-md bg-surface-muted p-3 text-sm">
              {skill.workedExample.stem}
            </p>
            <ol className="mt-3 grid list-decimal gap-1.5 pl-5 text-sm leading-relaxed">
              {skill.workedExample.walkthrough.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <p className="mt-3 rounded-md border border-border bg-surface p-3 text-sm">
              <span className="font-semibold">Take this away: </span>
              {skill.workedExample.takeaway}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="text-sm font-semibold">Common mistakes</h2>
            <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-sm leading-relaxed">
              {skill.commonMistakes.map((mistake, i) => (
                <li key={i}>{mistake}</li>
              ))}
            </ul>
          </Card>

          {!isWriting && (
            <section>
              <h2 className="mb-2 text-sm font-semibold">
                Questions{' '}
                <span className="font-normal text-foreground-subtle">
                  ({uniqueQuestionCount(available)} available
                  {secondary.length > 0 && `, ${secondary.length} shared with another skill`})
                </span>
              </h2>
              {available.length === 0 ? (
                <Notice tone="neutral">
                  <p className="font-medium">No questions are available for this skill yet</p>
                  <p className="mt-1">
                    The method above is ready to use, but nothing has been imported that this app can
                    mark. Work through this skill in the official papers instead — the{' '}
                    <Link to="/library/sources" className="underline underline-offset-2">
                      source list
                    </Link>{' '}
                    links to every paper and answer key the provider publishes.
                  </p>
                </Notice>
              ) : (
                <CardList>
                  {questions.map((question) => {
                    const state = questionState(question, attemptsByGroup, exposed, reviewByGroup)
                    return (
                      <QuestionPreviewCard
                        key={question.id}
                        to={`/library/question/${question.id}`}
                        identifier={question.id}
                        skillTitle={
                          question.primarySkillId !== skillId
                            ? `Scored under ${content.skillById.get(question.primarySkillId)?.title ?? question.primarySkillId}`
                            : question.secondaryTags.filter((t) => !content.skillById.has(t)).join(', ') ||
                              (question.provenance === 'app-fixture' ? 'Development fixture' : 'Official')
                        }
                        state={state.label}
                        tone={state.tone}
                        extra={
                          question.primarySkillId !== skillId ? (
                            <Badge tone="info" title="Scored under its primary skill; listed here for practice.">
                              Also trains this
                            </Badge>
                          ) : question.reservedForMock ? (
                            <Badge tone="info">Held out</Badge>
                          ) : null
                        }
                      />
                    )
                  })}
                </CardList>
              )}
            </section>
          )}
        </div>

        <aside className="grid content-start gap-4">
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Your evidence</h2>
            <div className="mt-2">
              <StatusBadge status={stats.status} correct={stats.fresh.correct} n={stats.fresh.n} />
            </div>
            <dl className="mt-3 grid gap-2 text-sm">
              <Row label="Fresh first attempts">
                <Fraction correct={stats.fresh.correct} n={stats.fresh.n} />
              </Row>
              <Row label="Repeat practice">
                <Fraction correct={stats.repeat.correct} n={stats.repeat.n} emptyLabel="none yet" />
              </Row>
              <Row label="Revealed, unscored">
                <span className="tabular-nums">{stats.unscored}</span>
              </Row>
              <Row label="Median time">
                <span className="tabular-nums">{formatDuration(stats.medianTimeMs)}</span>
              </Row>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-foreground-subtle">
              A status appears once there are {EVIDENCE.minForStatus} fresh first attempts, and
              describes the latest {EVIDENCE.recentWindow}. These are this app&rsquo;s thresholds, not a
              judgement about the real test.
            </p>
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-semibold">Related skills</h2>
            <ul className="mt-2 grid list-none gap-1.5 text-sm">
              {skill.relatedSkillIds.map((id) => {
                const related = content.skills.find((s) => s.id === id)
                if (!related) return null
                return (
                  <li key={id}>
                    <Link to={`/library/skill/${id}`} className="underline underline-offset-2 hover:text-primary">
                      {related.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>

          {available.length === 0 && (
            <Card className="p-4">
              <h2 className="text-sm font-semibold">Where to practise this</h2>
              <ul className="mt-2 grid list-none gap-1.5 text-sm">
                {SOURCES.filter((s) => s.exam === 'TARA' && s.year).map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.paperUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline underline-offset-2 hover:text-primary"
                    >
                      {s.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-foreground-subtle">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}
