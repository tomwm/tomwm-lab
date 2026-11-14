import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Essay, TimingSetting, WritingPrompt } from '@/domain/types'
import { WORD_LIMIT, countWords, truncateToWords } from '@/domain/wordcount'
import { formatClock } from '@/domain/timing'
import { addEssayRevision, recordExposure, saveEssayDraft } from '@/storage/repo'
import { downloadText, essayToPlainText } from '@/storage/backup'
import { Badge, Button, Card, Notice, cn } from '@/ui/primitives'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const AUTOSAVE_MS = 700

export interface EssayWorkspaceProps {
  essay: Essay
  prompt: WritingPrompt
  /** Absolute epoch ms. Null for untimed drafting. */
  deadlineAt: number | null
  timing: TimingSetting
  /** Rehearsal only: switching prompt warns before replacing associated work. */
  promptChoices?: WritingPrompt[]
  onChoosePrompt?: (promptId: string) => void
  onSubmitted?: (essay: Essay) => void
  /** Rehearsal hides coaching entirely until the whole session ends. */
  allowCoaching?: boolean
}

export function EssayWorkspace(props: EssayWorkspaceProps) {
  const { essay, prompt, deadlineAt } = props
  const [plan, setPlan] = useState(essay.plan)
  const [text, setText] = useState(essay.text)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [now, setNow] = useState(() => Date.now())
  const [expired, setExpired] = useState(false)
  const [confirmSwitch, setConfirmSwitch] = useState<string | null>(null)
  const [coachingOpen, setCoachingOpen] = useState(false)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef({ plan: essay.plan, text: essay.text })
  const expiryHandled = useRef(false)

  const words = useMemo(() => countWords(text), [text])
  const over = words > WORD_LIMIT
  const remaining = deadlineAt === null ? null : Math.max(0, deadlineAt - now)

  /* -------------------------- autosave -------------------------- */
  const flush = useCallback(async () => {
    setSaveState('saving')
    try {
      await saveEssayDraft(essay.id, { plan: latest.current.plan, text: latest.current.text })
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }, [essay.id])

  const queueSave = useCallback(
    (next: { plan?: string; text?: string }) => {
      latest.current = { ...latest.current, ...next }
      setSaveState('saving')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => void flush(), AUTOSAVE_MS)
    },
    [flush],
  )

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  // Warn about work that has not reached storage.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveState === 'saving' || saveState === 'error') e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [saveState])

  /* ---------------------------- clock ---------------------------- */
  useEffect(() => {
    if (deadlineAt === null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    const onVisible = () => setNow(Date.now())
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [deadlineAt])

  /* ------------------------ expiry handling ---------------------- */
  const handleExpiry = useCallback(async () => {
    if (expiryHandled.current) return
    expiryHandled.current = true
    if (timer.current) clearTimeout(timer.current)
    await saveEssayDraft(essay.id, { plan: latest.current.plan, text: latest.current.text })
    const full = latest.current.text
    const cut = truncateToWords(full, WORD_LIMIT)
    const updated = await addEssayRevision(
      essay.id,
      {
        at: Date.now(),
        text: cut.kept,
        wordCount: cut.keptWords,
        truncated: cut.truncated,
        archivedFullText: cut.truncated ? full : null,
        reason: 'expiry',
      },
      true,
    )
    setExpired(true)
    if (updated) props.onSubmitted?.(updated)
  }, [essay.id, props])

  useEffect(() => {
    if (deadlineAt !== null && remaining === 0 && !expired) void handleExpiry()
  }, [deadlineAt, remaining, expired, handleExpiry])

  /* ------------------------ manual submit ------------------------ */
  const submit = async () => {
    if (over) return
    if (timer.current) clearTimeout(timer.current)
    await saveEssayDraft(essay.id, { plan: latest.current.plan, text: latest.current.text })
    const updated = await addEssayRevision(
      essay.id,
      {
        at: Date.now(),
        text: latest.current.text,
        wordCount: countWords(latest.current.text),
        truncated: false,
        archivedFullText: null,
        reason: 'manual-submit',
      },
      true,
    )
    setSaveState('saved')
    if (updated) props.onSubmitted?.(updated)
  }

  const locked = expired || essay.status === 'submitted'

  return (
    <div className="grid gap-4">
      {/* --------------------------- header --------------------------- */}
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="prose-reading text-base font-medium">{prompt.statement}</p>
            <ul className="mt-2 grid list-decimal gap-1 pl-5 text-sm text-foreground-muted">
              {prompt.requirements.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          {remaining !== null && (
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  'text-2xl font-semibold tabular-nums',
                  remaining <= 60_000 ? 'text-danger' : remaining <= 300_000 ? 'text-warning' : '',
                )}
              >
                {formatClock(remaining)}
              </p>
              <p className="text-xs text-foreground-subtle">remaining</p>
            </div>
          )}
        </div>

        {props.promptChoices && props.promptChoices.length > 1 && !locked && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-sm font-medium">Choose your prompt</p>
            <div className="mt-2 grid gap-2">
              {props.promptChoices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => {
                    if (choice.id === prompt.id) return
                    if (text.trim() || plan.trim()) setConfirmSwitch(choice.id)
                    else props.onChoosePrompt?.(choice.id)
                  }}
                  className={cn(
                    'rounded-md border p-3 text-left text-sm',
                    choice.id === prompt.id
                      ? 'border-primary bg-surface-muted'
                      : 'border-border hover:bg-surface-muted',
                  )}
                  aria-pressed={choice.id === prompt.id}
                >
                  {choice.statement}
                </button>
              ))}
            </div>
            {confirmSwitch && (
              <Notice tone="warning" className="mt-3">
                <p className="font-medium">Switching prompt will start a new draft</p>
                <p className="mt-1">
                  Your current plan and draft stay saved and recoverable under Writing, but they belong
                  to this prompt and will not move across.
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      props.onChoosePrompt?.(confirmSwitch)
                      setConfirmSwitch(null)
                    }}
                  >
                    Switch anyway
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setConfirmSwitch(null)}>
                    Keep this prompt
                  </Button>
                </div>
              </Notice>
            )}
          </div>
        )}
      </Card>

      {/* ---------------------------- panes ---------------------------- */}
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="p-3">
          <label htmlFor="essay-plan" className="text-sm font-semibold">
            Plan
          </label>
          <p className="mt-0.5 text-xs text-foreground-subtle">
            Group your ideas around the three parts: what it means, the case against, how far you agree.
          </p>
          <textarea
            id="essay-plan"
            value={plan}
            disabled={locked}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            onChange={(e) => {
              setPlan(e.target.value)
              queueSave({ plan: e.target.value })
            }}
            rows={10}
            className="mt-2 w-full resize-y rounded-md border border-border-strong bg-surface p-2 text-sm leading-relaxed"
          />
        </Card>

        <Card className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="essay-text" className="text-sm font-semibold">
              Your response
            </label>
            <div className="flex items-center gap-2 text-xs">
              <SaveIndicator state={saveState} lastSavedAt={essay.lastSavedAt} />
              <Badge tone={over ? 'danger' : words > WORD_LIMIT * 0.9 ? 'warning' : 'neutral'}>
                {words} / {WORD_LIMIT} words
              </Badge>
            </div>
          </div>
          <textarea
            id="essay-text"
            value={text}
            disabled={locked}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            data-gramm="false"
            onChange={(e) => {
              setText(e.target.value)
              queueSave({ text: e.target.value })
            }}
            rows={20}
            className="prose-reading mt-2 w-full max-w-none resize-y rounded-md border border-border-strong bg-surface p-3 text-base leading-relaxed"
            placeholder="Write your response here."
          />
          <p className="mt-1.5 text-xs text-foreground-subtle">
            Words are counted as whitespace-separated tokens, with hyphenated forms counting as one.
            That is this app&rsquo;s rule for practice; it is not guaranteed to match the real
            counter exactly. Browser spellcheck and autocorrect are switched off where the browser
            allows it — the app cannot block every external writing aid, and you have to keep to that
            yourself.
          </p>

          {over && !locked && (
            <Notice tone="danger" className="mt-3">
              You are {words - WORD_LIMIT} words over the limit. Everything you have typed is kept, but
              you have to shorten it before submitting. If the clock runs out first, the first{' '}
              {WORD_LIMIT} words are submitted and the full text is archived.
            </Notice>
          )}

          {saveState === 'error' && (
            <Notice tone="danger" className="mt-3">
              <p className="font-medium">Your draft did not save</p>
              <p className="mt-1">
                Copy your text out now so nothing is lost, then try again.
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => void flush()}>
                  Retry save
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void navigator.clipboard?.writeText(text)}
                >
                  Copy to clipboard
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => downloadText(essayToPlainText({ ...essay, plan, text }, prompt.statement), `tara-essay-${essay.id}.txt`)}
                >
                  Download as text
                </Button>
              </div>
            </Notice>
          )}

          {expired && (
            <Notice tone="warning" className="mt-3" title="Time is up">
              Your work was submitted automatically.{' '}
              {essay.revisions.at(-1)?.truncated
                ? `The submitted version holds the first ${WORD_LIMIT} counted words; the full text you wrote is archived with it.`
                : 'The whole draft was within the limit and was submitted as written.'}
            </Notice>
          )}

          {!locked && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => void submit()} disabled={over || words === 0}>
                Submit response
              </Button>
              <Button variant="secondary" onClick={() => void flush()}>
                Save now
              </Button>
              <Button
                variant="quiet"
                onClick={() =>
                  downloadText(
                    essayToPlainText({ ...essay, plan, text }, prompt.statement),
                    `tara-essay-${essay.id}.txt`,
                  )
                }
              >
                Export as text
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* --------------------------- coaching --------------------------- */}
      {props.allowCoaching !== false && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Review checklist</h2>
          <p className="mt-0.5 text-xs text-foreground-subtle">
            {prompt.provenance === 'official'
              ? 'UAT-UK\u2019s own recommendations for the Writing Task, from the TARA question guide.'
              : 'Written for this prompt, not a generic list.'}{' '}
            Reading it does not count as exposure.
          </p>
          <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-sm">
            {prompt.coaching.checklist.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          {prompt.coaching.approaches.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            {coachingOpen ? (
              <div>
                <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  Possible approaches
                  <Badge tone="warning">Suggestions, not a model answer</Badge>
                </h3>
                <p className="mt-1 text-xs text-foreground-subtle">
                  Written for this app and reviewed. There is no single correct essay here — these are
                  three routes, each with a cost.
                </p>
                <ul className="mt-3 grid list-none gap-3">
                  {prompt.coaching.approaches.map((a) => (
                    <li key={a.heading} className="rounded-md border border-border bg-surface-muted p-3">
                      <p className="text-sm font-semibold">{a.heading}</p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{a.body}</p>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-4 text-sm font-semibold">Objections worth answering</h3>
                <ul className="mt-1.5 grid list-disc gap-1.5 pl-5 text-sm">
                  {prompt.coaching.counterpoints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCoachingOpen(true)
                    void recordExposure({
                      itemId: prompt.id,
                      duplicateGroupId: prompt.id,
                      reason: 'model-plan-viewed',
                      sessionId: essay.sessionId,
                    })
                  }}
                >
                  Reveal possible approaches
                </Button>
                <p className="mt-2 text-xs text-foreground-subtle">
                  Revealing marks this prompt as exposed. Anything you write on it afterwards is
                  supported practice rather than a fresh attempt.
                </p>
              </>
            )}
          </div>
          )}
        </Card>
      )}
    </div>
  )
}

function SaveIndicator({ state, lastSavedAt }: { state: SaveState; lastSavedAt: number | null }) {
  const label =
    state === 'saving'
      ? 'Saving…'
      : state === 'error'
        ? 'Not saved'
        : lastSavedAt
          ? `Saved ${new Date(lastSavedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
          : 'Not saved yet'
  return (
    <span
      role="status"
      className={cn(
        'tabular-nums',
        state === 'error' ? 'font-medium text-danger' : 'text-foreground-subtle',
      )}
    >
      {label}
    </span>
  )
}
