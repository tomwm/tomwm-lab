import { SourceTag, type Source } from '../Kpi'

export function Tile({ title, subtitle, source, children, className = '' }: { title: string; subtitle?: string; source: Source; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-5 md:p-6 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        <SourceTag source={source} />
      </div>
      {children}
    </section>
  )
}

export function Big({ value, unit, caption }: { value: string; unit?: string; caption?: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold leading-none tracking-tight">{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {caption && <p className="mt-2 text-sm leading-snug text-ink-2">{caption}</p>}
    </div>
  )
}
