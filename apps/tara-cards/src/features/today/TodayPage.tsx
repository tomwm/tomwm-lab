import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp, useContentIndex } from '@/app/AppContext'
import {
  useAttempts,
  useDueReviews,
  useEssays,
  useExposedGroups,
  useReportableAttempts,
  useSessions,
} from '@/app/hooks'
import { statsForComponent, suggestNextSkill } from '@/domain/aggregation'
import { isInteractive } from '@/domain/eligibility'
import { uniqueQuestionCount } from '@/app/questionState'
import { CardGrid, CollectionCard } from '@/ui/cards'
import { Badge, Button, ButtonLink, Card, Fraction, Notice, PageHeader } from '@/ui/primitives'
import { startDiagnostic, startPracticeSession } from '@/features/practice/start'
import { useSkillEvidence } from '@/app/hooks'
import { useState } from 'react'

export function TodayPage() {
  const content = useContentIndex()
  const { prefs, setPrefs } = useApp()
  const attempts = useAttempts()
  const reportable = useReportableAttempts()
  const exposed = useExposedGroups()
  const due = useDueReviews()
  const sessions = useSessions(10)
  const essays = useEssays()
  const evidence = useSkillEvidence()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const activeSession = sessions.find((s) => s.status === 'active')
  const draftEssay = essays.find((e) => e.status === 'draft')
  const isFirstUse = attempts.length === 0 && essays.length === 0

  const reasoningSkills = useMemo(
    () =>
      content.skills
        .filter((s) => s.componentId !== 'writing')
        .map((s) => ({ id: s.id, componentId: s.componentId, title: s.title })),
    [content.skills],
  )

  const suggestion = useMemo(
    () => suggestNextSkill(reportable, reasoningSkills),
    [reportable, reasoningSkills],
  )
  const suggestedSkill = suggestion ? content.skills.find((s) => s.id === suggestion.skillId) : null

  const unseenTotal = content.questions.filter(
    (q) => isInteractive(q) && !q.reservedForMock && !exposed.has(q.duplicateGroupId),
  )

  const daysToTest = prefs.testDate
    ? Math.ceil((new Date(prefs.testDate).getTime() - Date.now()) / 86_400_000)
    : null

  const startFresh = async () => {
    setBusy(true)
    try {
      const outcome = await startPracticeSession(
        {
          content,
          size: 5,
          mode: 'unseen-only',
          componentIds: ['critical-thinking', 'problem-solving'],
          skillIds: suggestion ? [suggestion.skillId] : [],
          timing: prefs.timing,
          prefs,
          evidence,
        },
        'quick',
      )
      if ('sessionId' in outcome) navigate(`/practice/session/${outcome.sessionId}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Today"
        lead={
          daysToTest !== null
            ? daysToTest >= 0
              ? `${daysToTest} ${daysToTest === 1 ? 'day' : 'days'} until your test date.`
              : 'Your recorded test date has passed — update it in Settings if that is wrong.'
            : undefined
        }
      />

      {isFirstUse && !prefs.onboardingDismissed && (
        <Card className="mb-5 p-4 sm:p-5">
          <h2 className="text-base font-semibold">Two ways to start</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Neither is required, and nothing is locked behind setting anything up.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ButtonLink to="/library">Explore skills</ButtonLink>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setBusy(true)
                void startDiagnostic(content, prefs.timing)
                  .then((outcome) => {
                    if ('sessionId' in outcome) navigate(`/practice/session/${outcome.sessionId}`)
                    else navigate('/practice')
                  })
                  .finally(() => setBusy(false))
              }}
            >
              Try a short diagnostic
            </Button>
            <Button variant="quiet" onClick={() => void setPrefs({ onboardingDismissed: true })}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {(activeSession || draftEssay) && (
        <Card className="mb-5 p-4">
          <h2 className="text-sm font-semibold">Pick up where you left off</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeSession && (
              <ButtonLink to={`/practice/session/${activeSession.id}`} size="sm">
                Resume session from{' '}
                {new Date(activeSession.createdAt).toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </ButtonLink>
            )}
            {draftEssay && (
              <ButtonLink to={`/writing/essay/${draftEssay.id}`} size="sm" variant="secondary">
                Continue essay ({draftEssay.wordCount} words)
              </ButtonLink>
            )}
          </div>
        </Card>
      )}

      {/* --------------------- What to do next --------------------- */}
      <Card className="mb-5 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Suggested next session</h2>
        {suggestion && suggestedSkill ? (
          <>
            <p className="mt-1.5 text-sm">
              <span className="font-medium">Practise {suggestedSkill.title.toLowerCase()}.</span>{' '}
              <span className="text-foreground-muted">{suggestion.reason}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ButtonLink to={`/practice?skill=${suggestion.skillId}`}>Build that set</ButtonLink>
              <ButtonLink to={`/library/skill/${suggestion.skillId}`} variant="secondary">
                Read the method first
              </ButtonLink>
            </div>
          </>
        ) : (
          <p className="mt-1.5 text-sm text-foreground-muted">
            Nothing to suggest yet. A suggestion appears once there is something in your history to
            point at — it is never invented from no data.
          </p>
        )}
      </Card>

      {/* ---------------------- Review and fresh -------------------- */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Due for review</h2>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{due.length}</p>
          <p className="mt-1 text-xs text-foreground-subtle">
            Questions you have met before, coming back on schedule. Getting these right shows
            retention of the item, not that you can do a new one.
          </p>
          <div className="mt-3">
            <ButtonLink to="/practice" size="sm" variant={due.length ? 'primary' : 'secondary'}>
              {due.length ? 'Start reviews' : 'Nothing due'}
            </ButtonLink>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold">Fresh questions</h2>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {uniqueQuestionCount(unseenTotal)}
          </p>
          <p className="mt-1 text-xs text-foreground-subtle">
            Never seen before. These are the only ones that can tell you whether the method transfers.
          </p>
          <div className="mt-3">
            <Button size="sm" disabled={busy || unseenTotal.length === 0} onClick={() => void startFresh()}>
              {unseenTotal.length ? 'Five fresh questions' : 'None left'}
            </Button>
          </div>
        </Card>
      </div>

      {/* ------------------------- Components ----------------------- */}
      <h2 className="mb-2 text-sm font-semibold">Your three components</h2>
      <CardGrid className="sm:grid-cols-1">
        {content.components.map((component) => {
          const stats = statsForComponent(reportable, component.id)
          const componentEssays = essays.filter((e) => e.status === 'submitted')
          return (
            <CollectionCard
              key={component.id}
              to={
                component.id === 'writing' ? '/writing' : `/library/component/${component.id}`
              }
              title={component.name}
              description={component.description}
              accent={component.accent}
              actionLabel={component.id === 'writing' ? 'Open writing' : 'Open component'}
              badges={
                component.id === 'writing' ? (
                  <Badge tone="wr">
                    {componentEssays.length}{' '}
                    {componentEssays.length === 1 ? 'response' : 'responses'} written
                  </Badge>
                ) : stats.fresh.n > 0 ? (
                  <Badge tone={component.accent}>
                    <Fraction correct={stats.fresh.correct} n={stats.fresh.n} /> fresh
                  </Badge>
                ) : (
                  <Badge tone="neutral">not started</Badge>
                )
              }
              meta={
                component.id === 'writing' ? (
                  <>
                    {content.prompts.length} prompts · the essay is passed on unscored, so there is no
                    grade to track
                  </>
                ) : (
                  <>
                    {stats.attemptCount} {stats.attemptCount === 1 ? 'attempt' : 'attempts'} recorded ·{' '}
                    {stats.unscored} revealed without answering
                  </>
                )
              }
            />
          )
        })}
      </CardGrid>

      <Notice tone="neutral" className="mt-5">
        There is no overall readiness score on this page, and there will not be one. What is shown is
        what you actually did, with its sample size. See{' '}
        <Link to="/progress" className="underline underline-offset-2">
          Progress
        </Link>{' '}
        for the breakdown, or{' '}
        <Link to="/settings/coverage" className="underline underline-offset-2">
          Coverage
        </Link>{' '}
        for what the app can and cannot mark.
      </Notice>

      {prefs.dailyMinutes === null && (
        <p className="mt-4 text-xs text-foreground-subtle">
          You can record a test date, the minutes you have today and a weekly target in{' '}
          <Link to="/settings" className="underline underline-offset-2">
            Settings
          </Link>
          . All of it is optional.
        </p>
      )}
    </div>
  )
}
