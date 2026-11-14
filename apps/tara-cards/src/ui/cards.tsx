import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { StudyComponent } from '@/domain/types'
import { Badge, Card, cn } from './primitives'

export const ACCENT_CLASS = {
  ct: { text: 'text-ct', bg: 'bg-ct-bg', border: 'border-ct-border', bar: 'bg-ct' },
  ps: { text: 'text-ps', bg: 'bg-ps-bg', border: 'border-ps-border', bar: 'bg-ps' },
  wr: { text: 'text-wr', bg: 'bg-wr-bg', border: 'border-wr-border', bar: 'bg-wr' },
} as const

export function accentFor(component: StudyComponent) {
  return ACCENT_CLASS[component.accent]
}

/**
 * A collection card: title, one-line description, a status or count, and one
 * explicit action. Not a wall of equally prominent metrics, and never an
 * ambiguous tile that flips.
 */
export function CollectionCard({
  to,
  title,
  description,
  accent,
  meta,
  actionLabel,
  badges,
}: {
  to: string
  title: string
  description: string
  accent?: 'ct' | 'ps' | 'wr'
  meta?: ReactNode
  actionLabel: string
  badges?: ReactNode
}) {
  const a = accent ? ACCENT_CLASS[accent] : null
  return (
    <Card as="li" className="group relative overflow-hidden transition-shadow hover:shadow-raised">
      {a && <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', a.bar)} />}
      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold">
            <Link to={to} className="after:absolute after:inset-0 after:content-['']">
              {title}
            </Link>
          </h3>
          {badges}
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{description}</p>
        {meta && <div className="mt-3 text-xs text-foreground-subtle">{meta}</div>}
        <p
          className={cn(
            'mt-3 inline-flex items-center gap-1 text-sm font-medium',
            a ? a.text : 'text-primary',
          )}
        >
          {actionLabel}
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </p>
      </div>
    </Card>
  )
}

/** A compact preview of a question. Never leaks the answer. */
export function QuestionPreviewCard({
  to,
  identifier,
  skillTitle,
  state,
  tone,
  extra,
}: {
  to: string
  identifier: string
  skillTitle: string
  state: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  extra?: ReactNode
}) {
  return (
    <Card as="li" className="relative transition-shadow hover:shadow-raised">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            <Link to={to} className="after:absolute after:inset-0 after:content-['']">
              {identifier}
            </Link>
          </p>
          <p className="mt-0.5 truncate text-xs text-foreground-subtle">{skillTitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {extra}
          <Badge tone={tone ?? 'neutral'}>{state}</Badge>
        </div>
      </div>
    </Card>
  )
}

export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn('grid list-none gap-3 sm:grid-cols-2', className)}>{children}</ul>
}

export function CardList({ children }: { children: ReactNode }) {
  return <ul className="grid list-none gap-2">{children}</ul>
}
