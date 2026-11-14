import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type {
  Attempt,
  Confidence,
  ErrorLabel,
  Question,
  TimingSetting,
} from '@/domain/types'
import { hasExplanation, isMarkable } from '@/domain/eligibility'
import { ContentBlocks } from '@/ui/ContentBlocks'
import { Badge, Button, Card, Notice, cn } from '@/ui/primitives'
import { AttemptKindBadge, FixtureBadge, OfficialBadge } from '@/ui/status'
import { useContentIndex } from '@/app/AppContext'
import {
  attemptForQuestionInSession,
  recordExposure,
  saveAttempt,
  updateAttempt,
} from '@/storage/repo'
import { SKILL_BY_ID } from '@/content/skills'

const ERROR_LABELS: { id: ErrorLabel; label: string }[] = [
  { id: 'misread-prompt', label: 'Misread the prompt' },
  { id: 'missed-condition', label: 'Missed a condition' },
  { id: 'wrong-method', label: 'Wrong reasoning or method' },
  { id: 'calculation', label: 'Calculation slip' },
  { id: 'time-pressure', label: 'Time pressure' },
  { id: 'guessed', label: 'Guessed' },
  { id: 'other', label: 'Other' },
]

const CONFIDENCE: { id: Confidence; label: string }[] = [
  { id: 'unsure', label: 'Unsure' },
  { id: 'likely', label: 'Likely' },
  { id: 'certain', label: 'Certain' },
]

export interface QuestionCardProps {
  question: Question
  /** 'learning' allows checking and revealing; 'exam' allows neither. */
  mode: 'learning' | 'exam'
  sessionId: string | null
  exposedGroupsAtStart: readonly string[]
  timing: TimingSetting
  /** Exam mode: the answer already persisted on the session. */
  selectedOptionId?: string | null
  onSelect?: (optionId: string) => void
  onAttempt?: (attempt: Attempt) => void
  onNext?: () => void
  nextLabel?: string
  /** Shown above the prompt in a module, e.g. "Question 4 of 22". */
  position?: string
  flagged?: boolean
  onToggleFlag?: () => void
}

export function QuestionCard(props: QuestionCardProps) {
  const { question, mode, sessionId } = props
  const content = useContentIndex()
  const groupId = question.duplicateGroupId
  const markable = isMarkable(question)

  const [selected, setSelected] = useState<string | null>(props.selectedOptionId ?? null)
  const [confidence, setConfidence] = useState<Confidence | null>(null)
  const [workings, setWorkings] = useState('')
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [revealedBeforeAnswer, setRevealedBeforeAnswer] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [labels, setLabels] = useState<ErrorLabel[]>([])
  const [reporting, setReporting] = useState(false)

  const startedAt = useRef(Date.now())
  const groupName = useId()
  const [announcement, setAnnouncement] = useState('')
  const resultRef = useRef<HTMLDivElement | null>(null)
  /** True only when this reveal came from the learner acting just now. */
  const justCommitted = useRef(false)

  // Reset per question.
  useEffect(() => {
    startedAt.current = Date.now()
    setSelected(props.selectedOptionId ?? null)
    setConfidence(null)
    setWorkings('')
    setAttempt(null)
    setRevealed(false)
    setRevealedBeforeAnswer(false)
    setNote('')
    setLabels([])
    setReporting(false)
    setAnnouncement('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id])

  // Seeing the prompt is an exposure. Because freshness is judged against the
  // groups exposed *before this session started*, seeing it here does not
  // disqualify the attempt the learner is about to make.
  useEffect(() => {
    void recordExposure({
      itemId: question.id,
      duplicateGroupId: groupId,
      reason: 'prompt-viewed',
      sessionId,
    })
  }, [question.id, groupId, sessionId])

  // Returning to a question already answered in this session shows the recorded
  // attempt again — it is never submitted a second time.
  useEffect(() => {
    if (!sessionId || mode === 'exam') return
    let cancelled = false
    void attemptForQuestionInSession(sessionId, question.id).then((existing) => {
      if (cancelled || !existing) return
      justCommitted.current = false
      setAttempt(existing)
      setSelected(existing.selectedOptionId)
      setConfidence(existing.confidence)
      setRevealed(true)
      setRevealedBeforeAnswer(existing.revealedBeforeAnswer)
      setLabels(existing.errorLabels)
      setNote(existing.note ?? '')
    })
    return () => {
      cancelled = true
    }
  }, [sessionId, question.id, mode])

  const commit = useCallback(
    async (viaReveal: boolean) => {
      if (busy || attempt) return
      setBusy(true)
      justCommitted.current = true
      try {
        if (viaReveal) {
          await recordExposure({
            itemId: question.id,
            duplicateGroupId: groupId,
            reason: 'answer-revealed',
            sessionId,
          })
        }
        const saved = await saveAttempt({
          question,
          sessionId,
          selectedOptionId: viaReveal ? null : selected,
          startedAt: startedAt.current,
          submittedAt: Date.now(),
          durationMs: Date.now() - startedAt.current,
          confidence,
          revealedBeforeAnswer: viaReveal,
          usedHint: false,
          exposedGroupsAtStart: props.exposedGroupsAtStart,
          timing: props.timing,
        })
        setAttempt(saved)
        setRevealed(true)
        setRevealedBeforeAnswer(viaReveal)
        props.onAttempt?.(saved)
      } finally {
        setBusy(false)
      }
    },
    [attempt, busy, confidence, groupId, props, question, selected, sessionId],
  )

  /**
   * Announce the outcome to a screen reader without moving focus. The live
   * region is rendered from the start and empty until there is something to
   * say — a region added at the same moment as its text is not reliably read.
   */
  useEffect(() => {
    if (!attempt) return
    const correct = question.options.find((o) => o.id === question.answerOptionId)
    const verdict =
      attempt.outcome === 'correct'
        ? 'Correct.'
        : attempt.outcome === 'incorrect'
          ? `Incorrect. The verified answer is ${correct?.label ?? 'not available'}.`
          : `Not scored. The verified answer is ${correct?.label ?? 'not available'}.`
    setAnnouncement(`${verdict} The explanation has opened below the answer options.`)
  }, [attempt, question])

  /**
   * Checking an answer removes the button the learner just pressed, so focus
   * would otherwise fall back to the top of the document. Move it once, and
   * predictably, onto the result that has just appeared.
   */
  useEffect(() => {
    if (!attempt || !justCommitted.current) return
    justCommitted.current = false
    resultRef.current?.focus()
  }, [attempt])

  const source = content.sourceById.get(question.locator.sourceId)
  const skill = SKILL_BY_ID.get(question.primarySkillId)
  const correctOption = question.options.find((o) => o.id === question.answerOptionId)
  const chosenOption = question.options.find((o) => o.id === attempt?.selectedOptionId)

  const outcomeTone =
    attempt?.outcome === 'correct' ? 'success' : attempt?.outcome === 'incorrect' ? 'danger' : 'warning'

  const optionsLocked = mode === 'learning' && attempt !== null

  const toggleLabel = async (id: ErrorLabel) => {
    const next = labels.includes(id) ? labels.filter((l) => l !== id) : [...labels, id]
    setLabels(next)
    if (attempt) await updateAttempt(attempt.id, { errorLabels: next })
  }

  const saveNote = async (value: string) => {
    setNote(value)
    if (attempt) await updateAttempt(attempt.id, { note: value || null })
  }

  const sourceLabel = useMemo(() => {
    if (question.provenance === 'app-fixture') return null
    if (!source) return question.locator.sourceId
    const n = question.locator.questionNumber
    return `${source.title}${n ? ` Q${n}` : ''}`
  }, [question, source])

  return (
    <Card className="overflow-hidden">
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* ---------------- Front: the attempt state ---------------- */}
      <div className="border-b border-border p-4 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {props.position && (
            <span className="text-xs font-medium text-foreground-subtle">{props.position}</span>
          )}
          {question.provenance === 'app-fixture' ? (
            <FixtureBadge />
          ) : (
            sourceLabel && <OfficialBadge label={sourceLabel} />
          )}
          {skill && <Badge tone={question.componentId === 'critical-thinking' ? 'ct' : 'ps'}>{skill.title}</Badge>}
          {!markable && <Badge tone="warning">No verified answer key</Badge>}
          <div className="ml-auto flex items-center gap-2">
            {props.onToggleFlag && (
              <Button
                variant="quiet"
                size="sm"
                onClick={props.onToggleFlag}
                aria-pressed={props.flagged ?? false}
              >
                {props.flagged ? 'Flagged' : 'Flag'}
              </Button>
            )}
          </div>
        </div>

        <ContentBlocks blocks={question.blocks} />

        <fieldset className="mt-5" disabled={optionsLocked}>
          <legend className="sr-only">Answer options</legend>
          <ul className="grid list-none gap-2">
            {question.options.map((option) => {
              const isChosen = selected === option.id
              const isCorrect = revealed && option.id === question.answerOptionId
              const isWrongChoice =
                revealed && attempt?.selectedOptionId === option.id && attempt.outcome === 'incorrect'
              return (
                <li key={option.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                      isCorrect
                        ? 'border-success/40 bg-success-bg'
                        : isWrongChoice
                          ? 'border-danger/40 bg-danger-bg'
                          : isChosen
                            ? 'border-primary bg-surface-muted'
                            : 'border-border hover:bg-surface-muted',
                      optionsLocked && 'cursor-default',
                    )}
                  >
                    <input
                      type="radio"
                      name={groupName}
                      value={option.id}
                      checked={isChosen}
                      onChange={() => {
                        setSelected(option.id)
                        props.onSelect?.(option.id)
                      }}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="mr-2 font-semibold tabular-nums">{option.label}</span>
                      <ContentBlocks blocks={option.blocks} className="inline [&_p]:inline [&_p]:mt-0" />
                    </span>
                    {isCorrect && (
                      <span className="shrink-0 text-xs font-semibold text-success">Correct answer</span>
                    )}
                    {isWrongChoice && (
                      <span className="shrink-0 text-xs font-semibold text-danger">Your answer</span>
                    )}
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>

        {mode === 'learning' && !attempt && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-foreground-muted">
                How sure are you? <span className="text-foreground-subtle">(optional)</span>
              </span>
              {CONFIDENCE.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={confidence === c.id ? 'primary' : 'secondary'}
                  aria-pressed={confidence === c.id}
                  onClick={() => setConfidence(confidence === c.id ? null : c.id)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-foreground-subtle">
              Confidence only changes when this question comes back for review. It never affects
              whether the answer is marked right or wrong.
            </p>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-foreground-muted">
                Working notes (private, not saved with the attempt)
              </summary>
              <textarea
                value={workings}
                onChange={(e) => setWorkings(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-md border border-border-strong bg-surface p-2 text-sm"
                placeholder="Scratch space for your working."
              />
            </details>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => void commit(false)} disabled={!selected || busy}>
                Check answer
              </Button>
              <Button variant="secondary" onClick={() => void commit(true)} disabled={busy}>
                Reveal without answering
              </Button>
            </div>
            <p className="mt-2 text-xs text-foreground-subtle">
              Revealing is recorded as having seen the question. It is not counted as a right or wrong
              answer.
            </p>
          </>
        )}

        {mode === 'exam' && (
          <p className="mt-4 text-xs text-foreground-subtle">
            Answers are saved as you select them. Nothing is marked until the module is submitted.
          </p>
        )}
      </div>

      {/* ---------------- Back: the review state ---------------- */}
      {revealed && attempt && (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="group"
          aria-label="Result and explanation"
          className="bg-surface-muted/60"
        >
          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={outcomeTone}>
                {attempt.outcome === 'correct'
                  ? 'Correct'
                  : attempt.outcome === 'incorrect'
                    ? 'Incorrect'
                    : 'Not scored'}
              </Badge>
              <AttemptKindBadge attempt={attempt} />
            </div>

            <dl className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="text-foreground-subtle">Your answer</dt>
                <dd className="font-medium">
                  {chosenOption ? chosenOption.label : revealedBeforeAnswer ? 'Not given' : '—'}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-foreground-subtle">Verified answer</dt>
                <dd className="font-medium">
                  {correctOption ? correctOption.label : 'Not available'}
                </dd>
              </div>
            </dl>

            {!markable && (
              <Notice tone="warning" className="mt-3">
                No verified answer key has been imported for this question, so it cannot be marked.
                Nothing has been scored.
              </Notice>
            )}

            {hasExplanation(question) ? (
              <section className="mt-4">
                <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  Explanation
                  <Badge tone={question.explanation.status === 'official' ? 'info' : 'neutral'}>
                    {question.explanation.status === 'official'
                      ? 'Official explanation'
                      : question.explanation.status === 'app-authored-reviewed'
                        ? 'Written for this app'
                        : 'Draft, not yet reviewed'}
                  </Badge>
                </h3>
                <ContentBlocks blocks={question.explanation.blocks} className="mt-2" />

                {question.explanation.distractors.length > 0 && (
                  <>
                    <h4 className="mt-4 text-sm font-semibold">Why the others tempt you</h4>
                    <ul className="mt-1.5 grid list-none gap-1.5 text-sm">
                      {question.explanation.distractors.map((d) => {
                        const opt = question.options.find((o) => o.id === d.optionId)
                        return (
                          <li key={d.optionId} className="flex gap-2">
                            <span className="font-semibold">{opt?.label ?? d.optionId}</span>
                            <span className="text-foreground-muted">{d.note}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </>
                )}

                {question.explanation.method && (
                  <p className="mt-4 rounded-md border border-border bg-surface p-3 text-sm">
                    <span className="font-semibold">Take this away: </span>
                    {question.explanation.method}
                  </p>
                )}

                {question.explanation.sourceNote && (
                  <p className="mt-2 text-xs text-foreground-subtle">{question.explanation.sourceNote}</p>
                )}
              </section>
            ) : (
              <Notice tone="neutral" className="mt-4">
                <p className="font-medium">Worked explanation not yet available</p>
                <p className="mt-1">
                  {markable
                    ? 'The verified answer above comes from the answer key. No explanation has been written or imported for this question yet, and none has been invented to fill the gap.'
                    : 'Neither an answer key nor an explanation has been imported for this question.'}
                </p>
              </Notice>
            )}

            {/* Error review */}
            <section className="mt-5">
              <h3 className="text-sm font-semibold">What happened?</h3>
              <p className="mt-1 text-xs text-foreground-subtle">
                Optional, and worth filling in even when you were right — a correct guess is still
                worth reviewing.
              </p>
              <ul className="mt-2 flex list-none flex-wrap gap-1.5">
                {ERROR_LABELS.map((l) => (
                  <li key={l.id}>
                    <Button
                      size="sm"
                      variant={labels.includes(l.id) ? 'primary' : 'secondary'}
                      aria-pressed={labels.includes(l.id)}
                      onClick={() => void toggleLabel(l.id)}
                    >
                      {l.label}
                    </Button>
                  </li>
                ))}
              </ul>
              <textarea
                value={note}
                onChange={(e) => void saveNote(e.target.value)}
                rows={2}
                aria-label="Note about this attempt"
                placeholder="A line to your future self."
                className="mt-2 w-full rounded-md border border-border-strong bg-surface p-2 text-sm"
              />
            </section>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {props.onNext && <Button onClick={props.onNext}>{props.nextLabel ?? 'Next question'}</Button>}
              {source && (
                <a
                  href={source.paperUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-md border border-border-strong px-3 py-2 text-sm font-medium hover:bg-surface"
                >
                  Open source ↗
                </a>
              )}
              <Button variant="quiet" size="sm" onClick={() => setReporting((v) => !v)}>
                Report a content issue
              </Button>
            </div>

            {reporting && (
              <Notice tone="neutral" className="mt-3">
                <p>
                  Content issues are recorded with the attempt. Describe the problem in the note box
                  above (for example: the diagram is missing, the key looks wrong, two options are
                  identical) and tag it “Other”. The coverage report in Settings lists items already
                  known to be incomplete.
                </p>
              </Notice>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
