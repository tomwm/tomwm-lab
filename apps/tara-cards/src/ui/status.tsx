import type { Attempt, ProvisionalStatus } from '@/domain/types'
import { STATUS_LABEL } from '@/domain/aggregation'
import { Badge } from './primitives'

const TONE: Record<ProvisionalStatus, 'neutral' | 'info' | 'warning' | 'success'> = {
  'not-started': 'neutral',
  'gathering-evidence': 'neutral',
  'needs-practice': 'warning',
  improving: 'info',
  'consistent-recently': 'success',
}

/**
 * A provisional status is always shown next to the fraction it came from, and
 * never on its own: these are this app's thresholds, not a readiness verdict.
 */
export function StatusBadge({
  status,
  correct,
  n,
}: {
  status: ProvisionalStatus
  correct: number
  n: number
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge tone={TONE[status]}>{STATUS_LABEL[status]}</Badge>
      {n > 0 && (
        <span className="text-xs tabular-nums text-foreground-subtle">
          {correct}/{n} fresh
        </span>
      )}
    </span>
  )
}

export function FixtureBadge() {
  return (
    <Badge tone="warning" title="Original content written for this app to demonstrate that it works. Not an official question.">
      Development fixture
    </Badge>
  )
}

export function OfficialBadge({ label }: { label: string }) {
  return (
    <Badge tone="info" title="Imported from official material, with its original wording preserved.">
      {label}
    </Badge>
  )
}

/**
 * What kind of evidence an attempt is. "Repeat practice" is reserved for an
 * answer actually given to a question the learner had met before — an
 * unanswered item or an early reveal is neither fresh nor repeat.
 */
export function attemptKind(attempt: Attempt): { label: string; tone: 'info' | 'neutral' | 'warning' } {
  if (attempt.freshFirstAttempt) return { label: 'Fresh first attempt', tone: 'info' }
  if (attempt.selectedOptionId === null && attempt.revealedBeforeAnswer)
    return { label: 'Revealed without answering', tone: 'warning' }
  if (attempt.selectedOptionId === null) return { label: 'No answer given', tone: 'warning' }
  if (attempt.revealedBeforeAnswer) return { label: 'Answered after revealing', tone: 'warning' }
  return { label: 'Repeat practice', tone: 'neutral' }
}

export function AttemptKindBadge({ attempt }: { attempt: Attempt }) {
  const kind = attemptKind(attempt)
  return <Badge tone={kind.tone}>{kind.label}</Badge>
}
