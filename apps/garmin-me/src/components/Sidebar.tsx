'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

const ICONS: Record<string, React.ReactNode> = {
  overview: <path d="M4 5h7v6H4zM13 5h7v10h-7zM4 13h7v6H4zM13 17h7v2h-7z" />,
  running: <path d="M13.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM6 21l3-6 3 2v4M9 9l3-2 3 3 3 1M12 7l-2 5 4 3" />,
  recovery: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  strength: <path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12" />,
  experiment: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7.500 15h9" />,
  health: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" />,
}

const NAV = [
  { href: '/', label: 'Overview', icon: 'overview' },
  { href: '/running', label: 'Running', icon: 'running' },
  { href: '/recovery', label: 'Recovery', icon: 'recovery' },
  { href: '/strength', label: 'Strength', icon: 'strength' },
  { href: '/health', label: 'Health', icon: 'health' },
]
/** Desktop sidebar only; not shown in the phone tab bar. */
const EXTRA = [{ href: '/experiment', label: 'Experiment', icon: 'experiment' }]

function Icon({ name }: { name: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  )
}

/** Left sidebar on desktop, bottom tab bar on phones. Keeps the selected range across sections. */
export function Sidebar() {
  const pathname = usePathname()
  const range = useSearchParams().get('range')
  const q = range ? `?range=${range}` : ''
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-line bg-surface px-3 py-6 md:flex">
        <div className="px-3 pb-8">
          <div className="text-[15px] font-semibold tracking-tight">Garmin Me</div>
          <div className="text-xs text-muted">Personal training &amp; recovery</div>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Sections">
          {[...NAV, ...EXTRA].map((n) => {
            const active = pathname === n.href
            return (
              <Link
                key={n.href}
                href={n.href + q}
                aria-current={active ? 'page' : undefined}
                className={`${n.href === '/experiment' ? 'mt-4 ' : ''}flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active ? 'bg-wash font-medium text-ink' : 'text-ink-2 hover:bg-wash hover:text-ink'
                }`}
              >
                <Icon name={n.icon} />
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto px-3 text-[11px] leading-relaxed text-muted">
          <ul className="mb-3 space-y-1" aria-label="Key to the dot on each card">
            <li className="flex items-center gap-2"><span className="h-[7px] w-[7px] rounded-full" style={{ background: 'var(--muted)' }} />Garmin data</li>
            <li className="flex items-center gap-2"><span className="h-[7px] w-[7px] rounded-full" style={{ background: 'var(--s4)' }} />Estimated by this app</li>
          </ul>
          <p>Read-only. Your data stays on this Mac. Not medical advice.</p>
        </div>
      </aside>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV.map((n) => {
          const active = pathname === n.href
          return (
            <Link
              key={n.href}
              href={n.href + q}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${active ? 'font-medium text-ink' : 'text-muted'}`}
            >
              <Icon name={n.icon} />
              {n.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
