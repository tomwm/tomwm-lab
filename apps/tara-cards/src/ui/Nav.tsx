import { NavLink, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { dueCount } from '@/storage/repo'
import { cn } from './primitives'

const ITEMS = [
  { to: '/', label: 'Today', end: true, icon: SunIcon },
  { to: '/library', label: 'Library', end: false, icon: StackIcon },
  { to: '/practice', label: 'Practice', end: false, icon: TargetIcon },
  { to: '/writing', label: 'Writing', end: false, icon: PenIcon },
  { to: '/progress', label: 'Progress', end: false, icon: ChartIcon },
] as const

export function Nav() {
  const due = useLiveQuery(() => dueCount(), [], 0) ?? 0
  const location = useLocation()

  return (
    <>
      {/* Desktop: a narrow sidebar */}
      <nav
        aria-label="Main"
        className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 md:flex"
      >
        <div className="px-2 pb-5">
          <p className="text-sm font-semibold tracking-tight">TARA Cards</p>
          <p className="mt-0.5 text-xs text-foreground-subtle">Personal study</p>
        </div>
        <ul className="flex flex-1 flex-col gap-0.5">
          {ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={linkClass}>
                <item.icon />
                <span>{item.label}</span>
                {item.to === '/practice' && due > 0 && <DueChip count={due} />}
              </NavLink>
            </li>
          ))}
        </ul>
        <NavLink to="/settings" className={cn(linkClass({ isActive: location.pathname.startsWith('/settings') }))}>
          <CogIcon />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Mobile: bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex">
          {ITEMS.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink to={item.to} end={item.end} className={mobileLinkClass}>
                <item.icon />
                <span className="text-[11px]">{item.label}</span>
                {item.to === '/practice' && due > 0 && (
                  <span className="sr-only">{due} reviews due</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}

function linkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-surface-muted text-foreground'
      : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground',
  )
}

function mobileLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex flex-col items-center gap-0.5 py-2',
    isActive ? 'text-primary' : 'text-foreground-muted',
  )
}

function DueChip({ count }: { count: number }) {
  return (
    <span className="ml-auto rounded-sm bg-warning-bg px-1.5 py-0.5 text-[11px] font-semibold text-warning">
      {count}
      <span className="sr-only"> reviews due</span>
    </span>
  )
}

/* Small inline icons — no icon dependency for five glyphs. */
const svg = 'h-4 w-4 shrink-0'
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function SunIcon() {
  return (
    <svg className={svg} viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.4 4.4l1 1M14.6 14.6l1 1M15.6 4.4l-1 1M5.4 14.6l-1 1" />
    </svg>
  )
}
function StackIcon() {
  return (
    <svg className={svg} viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
      <path d="M10 2.5 17.5 6 10 9.5 2.5 6 10 2.5Z" />
      <path d="M2.5 10 10 13.5 17.5 10M2.5 14 10 17.5 17.5 14" />
    </svg>
  )
}
function TargetIcon() {
  return (
    <svg className={svg} viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="3.2" />
      <circle cx="10" cy="10" r="0.6" fill="currentColor" />
    </svg>
  )
}
function PenIcon() {
  return (
    <svg className={svg} viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
      <path d="M3 17h3l9.2-9.2a2.1 2.1 0 0 0-3-3L3 14v3Z" />
      <path d="M12 5.2 14.8 8" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg className={svg} viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
      <path d="M3 17h14" />
      <path d="M6 17V9M10 17V4M14 17v-5" />
    </svg>
  )
}
function CogIcon() {
  return (
    <svg className={svg} viewBox="0 0 20 20" aria-hidden="true" {...stroke}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.6v1.6M10 15.8v1.6M17.4 10h-1.6M4.2 10H2.6M15.2 4.8l-1.1 1.1M5.9 14.1l-1.1 1.1M15.2 15.2l-1.1-1.1M5.9 5.9 4.8 4.8" />
    </svg>
  )
}
