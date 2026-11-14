import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, useContentIndex } from '@/app/AppContext'
import {
  useAttempts,
  useEssays,
  useExposures,
  useReportableAttempts,
  useSelfReports,
  useSessions,
} from '@/app/hooks'
import { EVIDENCE, statsForComponent, statsForSkill } from '@/domain/aggregation'
import { formatDuration } from '@/domain/timing'
import { scoreModule } from '@/domain/marking'
import type { ComponentId, ErrorLabel, Question } from '@/domain/types'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Fraction,
  Notice,
  PageHeader,
  cn,
} from '@/ui/primitives'
import { StatusBadge } from '@/ui/status'

const ERROR_LABEL_NAMES: Record<ErrorLabel, string> = {
  'misread-prompt': 'Misread the prompt',
  'missed-condition': 'Missed a condition',
  'wrong-method': 'Wrong reasoning or method',
  calculation: 'Calculation slip',
  'time-pressure': 'Time pressure',
  guessed: 'Guessed',
  other: 'Other',
}

export function ProgressPage() {
  const content = useContentIndex()
  const { prefs, setPrefs } = useApp()
  const reportable = useReportableAttempts()
  const allAttempts = useAttempts()
  const exposures = useExposures()
  const sessions = useSessions(40)
  const essays = useEssays()
  const selfReports = useSelfReports()
  const [tab, setTab] = useState<ComponentId>('critical-thinking')

  const excluded = allAttempts.length - reportable.length

  const component = content.components.find((c) => c.id === tab)!
  const skills = content.skills.filter((s) => s.componentId === tab)
  const stats = statsForComponent(reportable, tab)

  const modules = useMemo(
    () =>
      sessions
        .filter((s) => s.timing.kind === 'strict' && s.status !== 'active')
        .flatMap((session) =>
          session.stages
            .filter((stage) => stage.kind === 'module')
            .map((stage) => {
              const questions = stage.itemIds
                .map((id) => content.questionById.get(id))
                .filter((q): q is Question => Boolean(q))
              return {
                key: `${session.id}-${stage.id}`,
                at: session.createdAt,
                label: stage.label,
                multiplier: session.timing.multiplier,
                expired: stage.status === 'expired',
                score: scoreModule(questions, session.answers, session.exposedGroupsAtStart),
              }
            }),
        ),
    [sessions, content.questionById],
  )

  return (
    <div>
      <PageHeader
        title="Progress"
        lead="What your attempts actually show, with the sample size attached to every figure. There is no estimated 1–9 score here and no admissions probability, because neither can be produced honestly from this data."
      />

      {excluded > 0 && (
        <Notice tone="warning" className="mb-5">
          <p className="font-medium">
            {excluded} {excluded === 1 ? 'attempt is' : 'attempts are'} excluded from these figures
          </p>
          <p className="mt-1">
            They were on development fixtures — original questions written to show that the app works,
            not official material with calibrated difficulty. You can include them if you want to see
            the machinery working.
          </p>
          <div className="mt-2">
            <Button size="sm" variant="secondary" onClick={() => void setPrefs({ includeFixturesInProgress: true })}>
              Include fixtures in these figures
            </Button>
          </div>
        </Notice>
      )}
      {prefs.includeFixturesInProgress && (
        <Notice tone="warning" className="mb-5">
          <p className="font-medium">These figures include development fixtures</p>
          <p className="mt-1">
            Fixtures are not official questions and their difficulty is not calibrated. Treat
            everything below as a demonstration of the reports, not as evidence about the real test.
          </p>
          <div className="mt-2">
            <Button size="sm" variant="secondary" onClick={() => void setPrefs({ includeFixturesInProgress: false })}>
              Exclude fixtures again
            </Button>
          </div>
        </Notice>
      )}

      <div role="tablist" aria-label="Component" className="mb-5 flex flex-wrap gap-1.5">
        {content.components.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={tab === c.id}
            onClick={() => setTab(c.id)}
            className={cn(
              'rounded-md border px-3 py-2 text-sm font-medium',
              tab === c.id
                ? 'border-primary bg-surface-muted text-foreground'
                : 'border-border bg-surface text-foreground-muted hover:bg-surface-muted',
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {tab === 'writing' ? (
        <WritingProgress essays={essays} content={content} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <h2 className="text-sm font-semibold">Fresh first attempts</h2>
              <p className="mt-2 text-2xl font-semibold">
                <Fraction correct={stats.fresh.correct} n={stats.fresh.n} />
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground-subtle">
                Questions you had not met before, answered before revealing, with no help. This is the
                only figure that says anything about transfer to an unfamiliar question.
              </p>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-semibold">Repeat practice</h2>
              <p className="mt-2 text-2xl font-semibold">
                <Fraction correct={stats.repeat.correct} n={stats.repeat.n} emptyLabel="none yet" />
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground-subtle">
                Questions you had seen before. Getting these right shows you remember the item. It
                never raises the figure on the left.
              </p>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-semibold">Median time per question</h2>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{formatDuration(stats.medianTimeMs)}</p>
              <p className="mt-1.5 text-xs text-foreground-subtle">
                Across fresh attempts. A real module allows about 109 seconds a question.
              </p>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-semibold">Revealed without answering</h2>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{stats.unscored}</p>
              <p className="mt-1.5 text-xs text-foreground-subtle">
                Recorded as seen, never scored either way.
              </p>
            </Card>
          </div>

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold">By skill</h2>
            <ul className="grid list-none gap-2">
              {skills.map((skill) => {
                const s = statsForSkill(reportable, skill.id)
                return (
                  <Card as="li" key={skill.id} className="p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        to={`/library/skill/${skill.id}`}
                        className="text-sm font-medium underline-offset-2 hover:underline"
                      >
                        {skill.title}
                      </Link>
                      <StatusBadge status={s.status} correct={s.fresh.correct} n={s.fresh.n} />
                    </div>
                    <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                      <Stat label="Fresh">
                        <Fraction correct={s.fresh.correct} n={s.fresh.n} emptyLabel="—" />
                      </Stat>
                      <Stat label="Repeat">
                        <Fraction correct={s.repeat.correct} n={s.repeat.n} emptyLabel="—" />
                      </Stat>
                      <Stat label="Median time">{formatDuration(s.medianTimeMs)}</Stat>
                    </dl>
                  </Card>
                )
              })}
            </ul>
            <p className="mt-2 text-xs text-foreground-subtle">
              Every attempt counts towards exactly one skill — the primary skill recorded at the time
              you answered it — so these rows never double-count.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 text-sm font-semibold">Error patterns</h2>
            {Object.values(stats.errorLabels).every((n) => n === 0) ? (
              <EmptyState title="Nothing tagged yet">
                After you check an answer, tag what happened. Those tags build this list, and they are
                usually more useful than the score.
              </EmptyState>
            ) : (
              <Card className="p-4">
                <ul className="grid list-none gap-2">
                  {(Object.entries(stats.errorLabels) as [ErrorLabel, number][])
                    .filter(([, n]) => n > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([label, n]) => (
                      <li key={label} className="flex items-center gap-3 text-sm">
                        <span className="w-48 shrink-0">{ERROR_LABEL_NAMES[label]}</span>
                        <span
                          aria-hidden="true"
                          className="h-2 rounded-sm bg-primary"
                          style={{ width: `${Math.min(100, n * 12)}px` }}
                        />
                        <span className="tabular-nums text-foreground-subtle">{n}</span>
                      </li>
                    ))}
                </ul>
              </Card>
            )}
          </section>
        </>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold">Module results</h2>
        {modules.length === 0 ? (
          <EmptyState title="No timed modules yet">
            Raw counts appear here once you finish one. There is no scaled score, because this app has
            no way to produce one honestly.
          </EmptyState>
        ) : (
          <ul className="grid list-none gap-2">
            {modules.map((m) => (
              <Card as="li" key={m.key} className="flex flex-wrap items-center gap-3 p-3.5">
                <span className="text-sm font-medium">{m.label}</span>
                <span className="text-xs text-foreground-subtle">
                  {new Date(m.at).toLocaleDateString('en-GB')}
                </span>
                <span className="tabular-nums text-sm">
                  {m.score.correct}/{m.score.total} correct
                </span>
                <span className="text-xs text-foreground-subtle">
                  {m.score.incorrect} incorrect · {m.score.unanswered} unanswered ·{' '}
                  {m.score.previouslyExposed} previously seen
                </span>
                {m.multiplier !== 1 && <Badge tone="warning">×{m.multiplier} time</Badge>}
                {m.expired && <Badge tone="warning">ran out of time</Badge>}
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold">Exposure history</h2>
        <Card className="p-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Stat label="Distinct questions met">
              {new Set(exposures.map((e) => e.duplicateGroupId)).size}
            </Stat>
            <Stat label="Answers revealed early">
              {exposures.filter((e) => e.reason === 'answer-revealed').length}
            </Stat>
            <Stat label="Suggested approaches viewed">
              {exposures.filter((e) => e.reason === 'model-plan-viewed').length}
            </Stat>
            <Stat label="Results recorded from elsewhere">{selfReports.length}</Stat>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-foreground-subtle">
            This only covers what you did in this app. If you worked through a paper somewhere else,
            that exposure is unknown here unless you recorded it on the source card.
          </p>
        </Card>
      </section>

      <p className="mt-6 text-xs leading-relaxed text-foreground-subtle">
        Status labels appear once there are {EVIDENCE.minForStatus} fresh first attempts on a skill and
        describe the latest {EVIDENCE.recentWindow}. “Consistent recently” means at least{' '}
        {Math.round(EVIDENCE.consistentThreshold * 100)}% of those. These thresholds were chosen for
        this app; they are not validated readiness judgements, and{' '}
        <strong>{component.name}</strong> performance here says nothing about a real reported score.
      </p>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-foreground-subtle">{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  )
}

function WritingProgress({
  essays,
  content,
}: {
  essays: ReturnType<typeof useEssays>
  content: ReturnType<typeof useContentIndex>
}) {
  const submitted = essays.filter((e) => e.status === 'submitted')
  const themes = useMemo(() => {
    const counts = new Map<string, number>()
    for (const essay of essays)
      for (const record of essay.feedback)
        for (const imp of record.improvements)
          counts.set(imp.heading, (counts.get(imp.heading) ?? 0) + 1)
    return [...counts].sort((a, b) => b[1] - a[1])
  }, [essays])

  return (
    <div className="grid gap-3">
      <Card className="p-4">
        <h2 className="text-sm font-semibold">Completed writing</h2>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <Stat label="Responses submitted">{submitted.length}</Stat>
          <Stat label="Drafts in progress">{essays.length - submitted.length}</Stat>
          <Stat label="Prompts attempted">{new Set(essays.map((e) => e.promptId)).size}</Stat>
          <Stat label="Median length">
            {submitted.length
              ? `${median(submitted.map((e) => e.revisions.at(-1)?.wordCount ?? e.wordCount))} words`
              : '—'}
          </Stat>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-foreground-subtle">
          There is no grade here. UAT-UK does not score the essay — it passes it to participating
          universities as it stands — so an objective mark would be invented.
        </p>
      </Card>

      {submitted.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Your responses</h2>
          <ul className="mt-2 grid list-none gap-2">
            {submitted.map((essay) => (
              <li key={essay.id} className="flex flex-wrap items-center gap-2 text-sm">
                <Link to={`/writing/essay/${essay.id}`} className="underline underline-offset-2">
                  {content.promptById.get(essay.promptId)?.statement.slice(0, 60) ?? essay.promptId}…
                </Link>
                <span className="text-xs text-foreground-subtle">
                  {essay.revisions.length} {essay.revisions.length === 1 ? 'submission' : 'submissions'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="text-sm font-semibold">Recurring feedback themes</h2>
        {themes.length === 0 ? (
          <p className="mt-2 text-sm text-foreground-muted">
            Nothing yet. Themes are collected from AI feedback records, which are only produced when a
            provider has been configured. The per-prompt checklists work without one.
          </p>
        ) : (
          <ul className="mt-2 grid list-none gap-1.5 text-sm">
            {themes.map(([heading, n]) => (
              <li key={heading} className="flex items-center justify-between gap-2">
                <span>{heading}</span>
                <Badge tone="neutral">{n}×</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function median(values: number[]): number {
  if (!values.length) return 0
  const s = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}
