import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/* ------------------------------ Button ----------------------------- */

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'
type Size = 'sm' | 'md'

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary: 'bg-surface text-foreground border border-border-strong hover:bg-surface-muted',
  quiet: 'text-foreground-muted hover:text-foreground hover:bg-surface-muted',
  danger: 'bg-danger-bg text-danger border border-danger/30 hover:bg-danger/15',
}

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={cn(BUTTON_BASE, VARIANTS[variant], SIZES[size], className)} {...rest} />
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: {
  to: string
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
} & Omit<React.ComponentProps<typeof Link>, 'to' | 'className' | 'children'>) {
  return (
    <Link to={to} className={cn(BUTTON_BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </Link>
  )
}

/* ------------------------------- Card ------------------------------ */

export function Card({
  children,
  className,
  as: As = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'li' | 'section' | 'article'
}) {
  return (
    <As
      className={cn(
        'rounded-lg border border-border bg-surface shadow-card',
        className,
      )}
    >
      {children}
    </As>
  )
}

/* ------------------------------ Badge ------------------------------ */

type Tone = 'neutral' | 'ct' | 'ps' | 'wr' | 'success' | 'warning' | 'danger' | 'info'

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-foreground-muted border-border',
  ct: 'bg-ct-bg text-ct border-ct-border',
  ps: 'bg-ps-bg text-ps border-ps-border',
  wr: 'bg-wr-bg text-wr border-wr-border',
  success: 'bg-success-bg text-success border-success/25',
  warning: 'bg-warning-bg text-warning border-warning/25',
  danger: 'bg-danger-bg text-danger border-danger/25',
  info: 'bg-info-bg text-info border-info/25',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
  title,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
  title?: string
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------ Notice ----------------------------- */

export function Notice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: Tone
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-md border px-3 py-2.5 text-sm', TONES[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={cn(title && 'mt-1', 'leading-relaxed')}>{children}</div>
    </div>
  )
}

/* ------------------------- Section headings ------------------------ */

export function PageHeader({
  title,
  lead,
  actions,
  breadcrumb,
}: {
  title: string
  lead?: ReactNode
  actions?: ReactNode
  breadcrumb?: ReactNode
}) {
  return (
    <header className="mb-6">
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {lead && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-foreground-muted">{lead}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  )
}

export function Breadcrumb({ trail }: { trail: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-foreground-subtle">
        {trail.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {item.to ? (
              <Link to={item.to} className="underline underline-offset-2 hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
            {i < trail.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ------------------------------ States ----------------------------- */

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <Card className="p-6 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-foreground-muted">{children}</div>}
      {action && <div className="mt-4 flex justify-center gap-2">{action}</div>}
    </Card>
  )
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <p role="status" className="py-8 text-center text-sm text-foreground-muted">
      {label}…
    </p>
  )
}

/* ---------------------------- Form fields -------------------------- */

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-foreground-subtle">{hint}</p>}
    </div>
  )
}

export const inputClass =
  'w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle'

/** A fraction shown next to every derived statistic, never a bare percentage. */
export function Fraction({
  correct,
  n,
  emptyLabel = 'no attempts yet',
}: {
  correct: number
  n: number
  emptyLabel?: string
}) {
  if (n === 0) return <span className="text-foreground-subtle">{emptyLabel}</span>
  return (
    <span className="tabular-nums">
      {Math.round((correct / n) * 100)}%{' '}
      <span className="text-foreground-subtle">
        ({correct}/{n})
      </span>
    </span>
  )
}
