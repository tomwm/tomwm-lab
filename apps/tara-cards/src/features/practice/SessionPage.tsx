import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useApp, useContentIndex } from '@/app/AppContext'
import { db } from '@/storage/db'
import {
  createEssay,
  essayForSession,
  getSession,
  persistAnswer,
  persistFlag,
  saveSession,
} from '@/storage/repo'
import {
  TIMER_ANNOUNCE_SECONDS,
  formatClock,
  reconcileSession,
  stageRemainingMs,
  submitStage,
} from '@/domain/timing'
import { acquireLock, releaseLock, stealLock } from '@/storage/lock'
import type { Question, Session } from '@/domain/types'
import { QuestionCard } from './QuestionCard'
import { finaliseSession, recordStageAttempts } from './finalise'
import { EssayWorkspace } from '@/features/writing/EssayWorkspace'
import { Badge, Button, Card, EmptyState, Loading, Notice, cn } from '@/ui/primitives'

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const content = useContentIndex()
  const { prefs } = useApp()
  const navigate = useNavigate()

  const session = useLiveQuery(
    () => (sessionId ? getSession(sessionId) : Promise.resolve(undefined)),
    [sessionId],
    undefined,
  )

  const [lockConflict, setLockConflict] = useState(false)
  const reconciling = useRef(false)

  /* ------------------ deadline reconciliation ------------------- */
  const reconcile = useCallback(async () => {
    if (!sessionId || reconciling.current) return
    reconciling.current = true
    try {
      const current = await getSession(sessionId)
      if (!current) return
      const { session: next, changed } = reconcileSession(current, Date.now())
      if (changed) {
        await saveSession(next)
        // A deadline that passed while the tab was closed still has to record
        // the answers exactly as they stood when the clock stopped.
        await finaliseSession(next.id, content)
      }
    } finally {
      reconciling.current = false
    }
  }, [sessionId, content])

  useEffect(() => {
    void reconcile()
    const id = setInterval(() => void reconcile(), 1000)
    const onVisible = () => void reconcile()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [reconcile])

  /* ------------------------ the tab lock ------------------------ */
  const isStrict = session?.timing.kind === 'strict'
  useEffect(() => {
    if (!session || !isStrict || session.status !== 'active') return
    let cancelled = false
    void acquireLock(session.id).then((result) => {
      if (!cancelled && !result.ok) setLockConflict(true)
    })
    return () => {
      cancelled = true
      void releaseLock()
    }
  }, [session, isStrict])

  if (session === undefined) return <Loading label="Opening session" />
  if (!session) return <EmptyState title="Session not found">That session no longer exists.</EmptyState>

  if (lockConflict) {
    return (
      <Notice tone="warning" title="This session is open in another tab">
        <p>
          Two tabs writing to the same timed session can lose answers or submit it twice, so only one
          is allowed to save. Go back to the other tab, or take over here — the clock keeps running
          either way, and taking over does not give you more time.
        </p>
        <div className="mt-3">
          <Button
            onClick={() => {
              void stealLock(session.id).then(() => setLockConflict(false))
            }}
          >
            Take over in this tab
          </Button>
        </div>
      </Notice>
    )
  }

  if (session.status === 'submitted' || session.status === 'expired') {
    navigate(`/practice/summary/${session.id}`, { replace: true })
    return <Loading label="Opening results" />
  }

  const stage = session.stages[session.activeStageIndex]
  if (!stage) return <EmptyState title="Nothing to do">This session has no remaining stages.</EmptyState>

  if (stage.kind === 'writing') {
    return <WritingStage session={session} />
  }

  const questions = stage.itemIds
    .map((id) => content.questionById.get(id))
    .filter((q): q is Question => Boolean(q))

  return session.timing.kind === 'strict' ? (
    <ExamRunner session={session} questions={questions} prefs={prefs} />
  ) : (
    <LearningRunner session={session} questions={questions} />
  )
}

/* ==================================================================== */
/* Learning mode                                                        */
/* ==================================================================== */

function LearningRunner({ session, questions }: { session: Session; questions: Question[] }) {
  const navigate = useNavigate()
  const { prefs } = useApp()
  const [index, setIndex] = useState(0)
  const question = questions[index]

  const answered = useLiveQuery(
    () => db.attempts.where('sessionId').equals(session.id).count(),
    [session.id],
    0,
  ) ?? 0

  const finish = async () => {
    await saveSession({
      ...session,
      status: 'submitted',
      submittedAt: Date.now(),
      stages: session.stages.map((s) => submitStage(s, Date.now())),
    })
    navigate(`/practice/summary/${session.id}`)
  }

  if (!question) {
    return <EmptyState title="This set is empty">Nothing was selected for this session.</EmptyState>
  }

  const isLast = index === questions.length - 1

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">
            {session.mode === 'diagnostic' ? 'Short diagnostic' : 'Practice set'}
          </h1>
          <p className="text-sm text-foreground-muted">
            Question {index + 1} of {questions.length} · {answered} answered
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void finish()}>
          Finish and review
        </Button>
      </div>

      {session.mode === 'diagnostic' && index === 0 && (
        <Notice tone="info" className="mb-4">
          This is an initial snapshot over very small samples — one or two questions per skill. It is
          not a mock, and it will not label you. It only decides what to suggest next.
        </Notice>
      )}

      <progress
        value={index + 1}
        max={questions.length}
        className="mb-4 h-1 w-full [&::-webkit-progress-bar]:bg-surface-muted [&::-webkit-progress-value]:bg-primary"
      >
        {index + 1} of {questions.length}
      </progress>

      <QuestionCard
        key={question.id}
        question={question}
        mode="learning"
        sessionId={session.id}
        exposedGroupsAtStart={session.exposedGroupsAtStart}
        timing={prefs.timing}
        position={`Question ${index + 1} of ${questions.length}`}
        onNext={isLast ? () => void finish() : () => setIndex((i) => i + 1)}
        nextLabel={isLast ? 'Finish and review' : 'Next question'}
      />

      <div className="mt-4 flex justify-between">
        <Button variant="quiet" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          ← Previous
        </Button>
        <Button
          variant="quiet"
          onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
          disabled={isLast}
        >
          Skip →
        </Button>
      </div>
    </div>
  )
}

/* ==================================================================== */
/* Strictly timed module                                                */
/* ==================================================================== */

function ExamRunner({
  session,
  questions,
  prefs,
}: {
  session: Session
  questions: Question[]
  prefs: ReturnType<typeof useApp>['prefs']
}) {
  const content = useContentIndex()
  const stage = session.stages[session.activeStageIndex]
  const [index, setIndex] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const announced = useRef(new Set<number>())
  const [announcement, setAnnouncement] = useState('')
  const startedAt = useRef<Record<string, number>>({})
  const elapsed = useRef<Record<string, number>>({})

  const remaining = stageRemainingMs(stage, now)
  const question = questions[index]

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  // Track time per question so the summary can report it.
  useEffect(() => {
    if (!question) return
    const qid = question.id
    startedAt.current[qid] = Date.now()
    return () => {
      const began = startedAt.current[qid]
      if (began) elapsed.current[qid] = (elapsed.current[qid] ?? 0) + (Date.now() - began)
    }
  }, [question])

  // Announce only at meaningful milestones.
  useEffect(() => {
    const secs = Math.round(remaining / 1000)
    for (const mark of TIMER_ANNOUNCE_SECONDS) {
      if (secs <= mark && !announced.current.has(mark)) {
        announced.current.add(mark)
        setAnnouncement(mark === 0 ? 'Time is up.' : `${Math.round(mark / 60)} minutes remaining.`)
      }
    }
  }, [remaining])

  const submit = useCallback(async () => {
    const at = Date.now()
    const fresh = await getSession(session.id)
    if (!fresh) return
    const currentStage = fresh.stages[fresh.activeStageIndex]
    if (!currentStage || currentStage.status === 'submitted' || currentStage.status === 'expired') return

    const durations: Record<string, number> = {}
    for (const q of questions) {
      const began = startedAt.current[q.id]
      durations[q.id] = (elapsed.current[q.id] ?? 0) + (began ? at - began : 0)
    }

    const stages = fresh.stages.map((s, i) => (i === fresh.activeStageIndex ? submitStage(s, at) : s))
    const { session: reconciled } = reconcileSession({ ...fresh, stages }, at)
    await saveSession(reconciled)
    await recordStageAttempts(reconciled, reconciled.stages[fresh.activeStageIndex], content, durations)
  }, [questions, session.id, content])

  // A module whose deadline passed while the tab was closed records its answers
  // as they stood and cannot be reopened.
  useEffect(() => {
    if (stage.status === 'expired') void submit()
  }, [stage.status, submit])

  if (!question) return <EmptyState title="This module is empty">No questions were selected.</EmptyState>

  const answeredCount = questions.filter((q) => session.answers[q.id]).length
  const shortModule = questions.length < 22

  return (
    <div>
      <div aria-live="assertive" className="sr-only">
        {announcement}
      </div>

      <Card className="sticky top-0 z-30 mb-4 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{stage.label}</p>
            <p className="text-xs text-foreground-subtle">
              {answeredCount} of {questions.length} answered
              {session.disclosedSeenCount > 0 && ` · ${session.disclosedSeenCount} previously seen`}
              {prefs.timing.multiplier !== 1 && ` · ×${prefs.timing.multiplier} time`}
            </p>
          </div>
          <p
            className={cn(
              'text-2xl font-semibold tabular-nums',
              remaining <= 60_000 ? 'text-danger' : remaining <= 300_000 ? 'text-warning' : '',
            )}
          >
            {formatClock(remaining)}
          </p>
        </div>

        <ol className="mt-3 flex list-none flex-wrap gap-1">
          {questions.map((q, i) => {
            const isAnswered = Boolean(session.answers[q.id])
            const isFlagged = Boolean(session.flagged[q.id])
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={i === index ? 'true' : undefined}
                  aria-label={`Question ${i + 1}${isAnswered ? ', answered' : ', not answered'}${isFlagged ? ', flagged' : ''}`}
                  className={cn(
                    'relative h-8 w-8 rounded-sm border text-xs font-medium tabular-nums',
                    i === index
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isAnswered
                        ? 'border-border-strong bg-surface-muted'
                        : 'border-border bg-surface text-foreground-subtle',
                  )}
                >
                  {i + 1}
                  {isFlagged && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-warning"
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </Card>

      {shortModule && index === 0 && (
        <Notice tone="warning" className="mb-4">
          A real module is 22 questions. This one has {questions.length}, because that is how many
          approved questions exist here. The clock is still the full module length.
        </Notice>
      )}

      <QuestionCard
        key={question.id}
        question={question}
        mode="exam"
        sessionId={session.id}
        exposedGroupsAtStart={session.exposedGroupsAtStart}
        timing={session.timing}
        selectedOptionId={session.answers[question.id] ?? null}
        onSelect={(optionId) => void persistAnswer(session.id, question.id, optionId)}
        flagged={Boolean(session.flagged[question.id])}
        onToggleFlag={() =>
          void persistFlag(session.id, question.id, !session.flagged[question.id])
        }
        position={`Question ${index + 1} of ${questions.length}`}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
            ← Previous
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={index === questions.length - 1}
          >
            Next →
          </Button>
        </div>
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Submit module
        </Button>
      </div>

      {confirming && (
        <Notice tone="warning" className="mt-4" title="Submit this module?">
          <p>
            {questions.length - answeredCount > 0
              ? `${questions.length - answeredCount} ${questions.length - answeredCount === 1 ? 'question is' : 'questions are'} unanswered, and there is no penalty for a wrong answer — a guess costs nothing. `
              : 'Every question is answered. '}
            Once submitted this module locks and cannot be reopened.
          </p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => void submit()}>Yes, submit</Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Keep working
            </Button>
          </div>
        </Notice>
      )}
    </div>
  )
}

/* ==================================================================== */
/* Writing stage of a full rehearsal                                    */
/* ==================================================================== */

function WritingStage({ session }: { session: Session }) {
  const content = useContentIndex()
  const stage = session.stages[session.activeStageIndex]
  const [essayId, setEssayId] = useState<string | null>(session.essayId)
  const [promptId, setPromptId] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const choices = stage.itemIds
    .map((id) => content.promptById.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const essay = useLiveQuery(
    () => (essayId ? db.essays.get(essayId) : essayForSession(session.id)),
    [essayId, session.id],
    undefined,
  )

  useEffect(() => {
    if (essay && !essayId) setEssayId(essay.id)
    if (essay && !promptId) setPromptId(essay.promptId)
  }, [essay, essayId, promptId])

  const chosen = promptId ? content.promptById.get(promptId) : null
  const remaining = stageRemainingMs(stage, now)

  const begin = async (id: string) => {
    const prompt = content.promptById.get(id)
    if (!prompt) return
    const created = await createEssay({
      promptId: prompt.id,
      promptVersion: prompt.version,
      sessionId: session.id,
      timing: session.timing,
    })
    await saveSession({ ...session, essayId: created.id })
    setEssayId(created.id)
    setPromptId(prompt.id)
  }

  const finishStage = async () => {
    const at = Date.now()
    const fresh = await getSession(session.id)
    if (!fresh) return
    const stages = fresh.stages.map((s, i) => (i === fresh.activeStageIndex ? submitStage(s, at) : s))
    const { session: reconciled } = reconcileSession({ ...fresh, stages }, at)
    await saveSession(reconciled)
  }

  if (!chosen || !essay) {
    return (
      <div>
        <Card className="mb-4 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{stage.label}</p>
            <p className="text-2xl font-semibold tabular-nums">{formatClock(remaining)}</p>
          </div>
        </Card>
        <Card className="p-4">
          <h1 className="text-lg font-semibold">Choose one prompt</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            The clock is already running. Read all three, then commit to one.
          </p>
          <div className="mt-3 grid gap-2">
            {choices.map((prompt) => (
              <button
                key={prompt.id}
                type="button"
                onClick={() => void begin(prompt.id)}
                className="rounded-md border border-border p-3 text-left hover:bg-surface-muted"
              >
                <p className="prose-reading text-sm font-medium">{prompt.statement}</p>
                <ul className="mt-1.5 grid list-decimal gap-0.5 pl-5 text-xs text-foreground-muted">
                  {prompt.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{stage.label}</p>
            <p className="text-xs text-foreground-subtle">
              Nothing is revealed until the whole rehearsal ends.
            </p>
          </div>
          <Badge tone="warning">Rehearsal in progress</Badge>
        </div>
      </Card>

      <EssayWorkspace
        essay={essay}
        prompt={chosen}
        deadlineAt={stage.deadlineAt === null ? null : stage.deadlineAt + stage.pausedMs}
        timing={session.timing}
        promptChoices={choices}
        onChoosePrompt={(id) => void begin(id)}
        allowCoaching={false}
        onSubmitted={() => void finishStage()}
      />
    </div>
  )
}
