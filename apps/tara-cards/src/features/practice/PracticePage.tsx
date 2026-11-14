import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp, useContentIndex } from '@/app/AppContext'
import { useDueReviews, useExposedGroups, useSessions, useSkillEvidence } from '@/app/hooks'
import { assessRehearsal, allowedMsFor, pickRehearsalItems } from '@/domain/sessions'
import { isInteractive, isPromptUsable, isTaraFormat } from '@/domain/eligibility'
import {
  MODULE_MINUTES,
  MODULE_QUESTION_COUNT,
  WRITING_PRESET_MINUTES,
  WRITING_PROMPT_CHOICES,
} from '@/domain/timing'
import type { ComponentId, SelectionModeLike } from './types'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  inputClass,
} from '@/ui/primitives'
import { startDiagnostic, startPracticeSession, startRehearsal, startTimedModule } from './start'
import { exposedGroupsAt } from '@/storage/repo'
import type { SelectionMode } from '@/domain/selection'

export function PracticePage() {
  const content = useContentIndex()
  const { prefs } = useApp()
  const evidence = useSkillEvidence()
  const exposed = useExposedGroups()
  const due = useDueReviews()
  const sessions = useSessions(8)
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [component, setComponent] = useState<Exclude<ComponentId, 'writing'> | 'both'>('both')
  const [skillId, setSkillId] = useState<string>('')
  const [size, setSize] = useState(10)
  const [mode, setMode] = useState<SelectionMode>('mixed')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Deep links from a skill card: /practice?skill=…&start=1
  useEffect(() => {
    const paramSkill = params.get('skill')
    const paramComponent = params.get('component')
    if (paramSkill) {
      setSkillId(paramSkill)
      const skill = content.skills.find((s) => s.id === paramSkill)
      if (skill && skill.componentId !== 'writing') setComponent(skill.componentId)
    } else if (paramComponent === 'critical-thinking' || paramComponent === 'problem-solving') {
      setComponent(paramComponent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, content.skills])

  const componentIds: Exclude<ComponentId, 'writing'>[] =
    component === 'both' ? ['critical-thinking', 'problem-solving'] : [component]

  const skillChoices = useMemo(
    () => content.skills.filter((s) => s.componentId !== 'writing' && componentIds.includes(s.componentId as never)),
    [content.skills, component],
  )

  const active = sessions.filter((s) => s.status === 'active')

  const rehearsal = useMemo(
    () =>
      assessRehearsal({
        questions: content.questions,
        prompts: content.prompts,
        exposedGroups: exposed,
        allowFixtures: true,
      }),
    [content, exposed],
  )

  const startSet = async (requestedSize: number, requestedMode: SelectionMode, sessionMode: 'quick' | 'custom' | 'review') => {
    setBusy(true)
    setMessage(null)
    try {
      const outcome = await startPracticeSession(
        {
          content,
          size: requestedSize,
          mode: requestedMode,
          componentIds,
          skillIds: skillId ? [skillId] : [],
          timing: prefs.timing,
          prefs,
          evidence,
        },
        sessionMode,
      )
      if ('error' in outcome) {
        setMessage(outcome.error)
        return
      }
      navigate(`/practice/session/${outcome.sessionId}`)
    } finally {
      setBusy(false)
    }
  }

  const startModule = async (componentId: Exclude<ComponentId, 'writing'>) => {
    setBusy(true)
    try {
      const exposedBefore = new Set(await exposedGroupsAt(Date.now()))
      const items = pickRehearsalItems(content.questions, componentId, exposedBefore, `module-${Date.now()}`, true)
      if (items.length === 0) {
        setMessage('No approved questions are available for that component yet.')
        return
      }
      const session = await startTimedModule({
        content,
        componentId,
        questions: items,
        timing: { ...prefs.timing, kind: 'strict' },
      })
      navigate(`/practice/session/${session.id}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Practice"
        lead="Short learning sets check one answer at a time. Timed work runs to a real clock and reveals nothing until it is submitted."
      />

      {active.length > 0 && (
        <Notice tone="info" className="mb-5">
          <p className="font-medium">You have {active.length} unfinished {active.length === 1 ? 'session' : 'sessions'}</p>
          <ul className="mt-2 grid list-none gap-1.5">
            {active.map((s) => (
              <li key={s.id}>
                <Link to={`/practice/session/${s.id}`} className="underline underline-offset-2">
                  Resume {describeMode(s.mode)} started{' '}
                  {new Date(s.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                </Link>
              </li>
            ))}
          </ul>
        </Notice>
      )}

      {message && (
        <Notice tone="warning" className="mb-5">
          {message}
        </Notice>
      )}

      {/* ------------------------- Quick set ------------------------- */}
      <Card className="p-4 sm:p-5">
        <h2 className="text-base font-semibold">Quick set</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          A mixed set: about 60% questions you have not seen, and the rest reviews that are due.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void startSet(5, 'mixed', 'quick')}>
            5 questions
          </Button>
          <Button disabled={busy} onClick={() => void startSet(10, 'mixed', 'quick')}>
            10 questions
          </Button>
          <Button
            variant="secondary"
            disabled={busy || due.length === 0}
            onClick={() => void startSet(Math.min(due.length, 20), 'review-only', 'review')}
          >
            {due.length > 0 ? `Reviews due (${due.length})` : 'No reviews due'}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => void startSet(10, 'unseen-only', 'custom')}>
            Unseen only
          </Button>
        </div>
      </Card>

      {/* ------------------------ Custom set ------------------------- */}
      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Custom set</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Component" htmlFor="p-component">
            <select
              id="p-component"
              value={component}
              onChange={(e) => {
                setComponent(e.target.value as typeof component)
                setSkillId('')
              }}
              className={inputClass}
            >
              <option value="both">Both reasoning components</option>
              <option value="critical-thinking">Critical Thinking</option>
              <option value="problem-solving">Problem Solving</option>
            </select>
          </Field>
          <Field label="Skill" htmlFor="p-skill">
            <select id="p-skill" value={skillId} onChange={(e) => setSkillId(e.target.value)} className={inputClass}>
              <option value="">Any skill</option>
              {skillChoices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="How many questions" htmlFor="p-size">
            <input
              id="p-size"
              type="number"
              min={1}
              max={50}
              value={size}
              onChange={(e) => setSize(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className={inputClass}
            />
          </Field>
          <Field
            label="Mix"
            htmlFor="p-mix"
            hint="Unseen only never quietly includes something you have met before — it gives you a shorter set instead."
          >
            <select
              id="p-mix"
              value={mode}
              onChange={(e) => setMode(e.target.value as SelectionMode)}
              className={inputClass}
            >
              <option value="mixed">Mixed (60% unseen, 40% due reviews)</option>
              <option value="unseen-only">Unseen only</option>
              <option value="review-only">Due reviews only</option>
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Button disabled={busy} onClick={() => void startSet(size, mode, 'custom')}>
            Build this set
          </Button>
        </div>
      </Card>

      {/* --------------------- Short diagnostic ---------------------- */}
      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Short diagnostic</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          One unseen question per Critical Thinking skill and two per Problem Solving skill, where
          coverage allows. An initial snapshot over small samples — not a mock, and not a reliable
          estimate of ability.
        </p>
        <div className="mt-3">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              void startDiagnostic(content, prefs.timing)
                .then((outcome) => {
                  if ('sessionId' in outcome) navigate(`/practice/session/${outcome.sessionId}`)
                  else
                    setMessage(
                      `${outcome.plan.note} Missing coverage: ${outcome.plan.missingSkillIds.join(', ') || 'none'}.`,
                    )
                })
                .finally(() => setBusy(false))
            }}
          >
            Start diagnostic
          </Button>
        </div>
      </Card>

      {/* ---------------------- Timed practice ----------------------- */}
      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Timed module</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          {MODULE_QUESTION_COUNT} questions in {MODULE_MINUTES} minutes is the real module length. When
          there are fewer approved questions than that, the clock still runs for the full{' '}
          {MODULE_MINUTES} minutes and the card says how many questions you actually got.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['critical-thinking', 'problem-solving'] as const).map((id) => {
            const count = content.questions.filter((q) => q.componentId === id && isInteractive(q) && isTaraFormat(q)).length
            return (
              <Button key={id} variant="secondary" disabled={busy || count === 0} onClick={() => void startModule(id)}>
                {id === 'critical-thinking' ? 'Critical Thinking' : 'Problem Solving'}
                <Badge tone="neutral">{Math.min(count, MODULE_QUESTION_COUNT)} q</Badge>
              </Button>
            )
          })}
        </div>
        {prefs.timing.multiplier !== 1 && (
          <p className="mt-2 text-xs text-warning">
            Your time multiplier is ×{prefs.timing.multiplier}. Results are grouped by timing setting
            and never pooled with standard-time attempts.
          </p>
        )}
      </Card>

      {/* --------------------- Full rehearsal ------------------------ */}
      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Full rehearsal</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Two {MODULE_MINUTES}-minute modules back to back, then the writing stage. This is
          TARA-format practice assembled from the material available here — not an official paper,
          and not calibrated to the real test&rsquo;s difficulty or skill distribution.
        </p>

        {rehearsal.available ? (
          <>
            {rehearsal.seenReuseCount > 0 && (
              <Notice tone="warning" className="mt-3">
                {rehearsal.seenReuseCount} of the questions would be ones you have already met. Held-out
                material is used first.
              </Notice>
            )}
            <div className="mt-3">
              <Button
                disabled={busy}
                onClick={() => {
                  setBusy(true)
                  void startRehearsal({
                    content,
                    prompts: content.prompts.filter(isPromptUsable),
                    timing: { ...prefs.timing, kind: 'strict' },
                  })
                    .then((s) => navigate(`/practice/session/${s.id}`))
                    .finally(() => setBusy(false))
                }}
              >
                Start full rehearsal
              </Button>
            </div>
          </>
        ) : (
          <Notice tone="warning" className="mt-3" title="Not available yet">
            <p>A full rehearsal needs {MODULE_QUESTION_COUNT} approved questions in each reasoning component and {WRITING_PROMPT_CHOICES} eligible writing prompts.</p>
            <ul className="mt-2 grid list-disc gap-1 pl-5">
              {rehearsal.shortfalls.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <p className="mt-2">
              The official practice tests run in the provider&rsquo;s own player and mirror the live test
              software. Until more material is imported here, that is the closest thing to a full
              rehearsal — see the{' '}
              <Link to="/library/sources" className="underline underline-offset-2">
                source list
              </Link>
              .
            </p>
          </Notice>
        )}
        <p className="mt-3 text-xs text-foreground-subtle">
          Writing stage: {WRITING_PRESET_MINUTES} minutes, the official Writing Task time
          {prefs.timing.multiplier !== 1 &&
            ` (${Math.round(allowedMsFor(WRITING_PRESET_MINUTES, prefs.timing) / 60000)} at your current multiplier)`}
          .
        </p>
      </Card>

      {/* ------------------ Official practice links ------------------ */}
      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Official practice</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Two practice tests run in Pearson VUE&rsquo;s own player and mirror the live test software. Take
          them there under timed conditions, then come back and record the result.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="https://www.pearsonvue.com/us/en/uatuk.html"
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Open official practice tests ↗
          </a>
          <ButtonLink to="/library/sources" variant="secondary">
            Record a result
          </ButtonLink>
        </div>
      </Card>

      {sessions.length === 0 && (
        <EmptyState title="Nothing practised yet" action={<Button onClick={() => void startSet(5, 'mixed', 'quick')}>Try five questions</Button>}>
          Sets you build appear here so you can pick one back up.
        </EmptyState>
      )}
    </div>
  )
}

function describeMode(mode: string): string {
  switch (mode) {
    case 'quick':
      return 'quick set'
    case 'custom':
      return 'custom set'
    case 'diagnostic':
      return 'diagnostic'
    case 'review':
      return 'review set'
    case 'timed-module':
      return 'timed module'
    case 'full-rehearsal':
      return 'full rehearsal'
    default:
      return mode
  }
}

export type { SelectionModeLike }
