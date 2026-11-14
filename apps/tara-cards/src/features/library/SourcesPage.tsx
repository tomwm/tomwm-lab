import { useMemo, useState } from 'react'
import { useContentIndex } from '@/app/AppContext'
import { useSelfReports } from '@/app/hooks'
import { addSelfReport, deleteSelfReport } from '@/storage/repo'
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  Field,
  Notice,
  PageHeader,
  inputClass,
} from '@/ui/primitives'
import type { ComponentId, Source } from '@/domain/types'
import { SOURCES_RETRIEVED_AT } from '@/content/sources'

/**
 * Source-linked practice. A paper card opens the provider's own PDF and lets
 * the learner record what they scored. Results entered here are self-reported
 * and are labelled as such everywhere they appear.
 */
export function SourcesPage() {
  const content = useContentIndex()
  const reports = useSelfReports()
  const [filter, setFilter] = useState<'all' | 'TARA' | 'BMAT' | 'TSA'>('all')
  const [recording, setRecording] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const visible = content.sources.filter(
      (s) => s.id !== 'app-fixtures' && (filter === 'all' || s.exam === filter),
    )
    return {
      reference: visible.filter((s) => !s.year || s.exam === 'TARA'),
      papers: visible.filter((s) => s.year && s.exam !== 'TARA'),
    }
  }, [content.sources, filter])

  const reportsBySource = useMemo(() => {
    const map = new Map<string, typeof reports>()
    for (const r of reports) map.set(r.sourceId, [...(map.get(r.sourceId) ?? []), r])
    return map
  }, [reports])

  return (
    <div>
      <Breadcrumb trail={[{ label: 'Library', to: '/library' }, { label: 'Sources' }]} />
      <PageHeader
        title="Official sources"
        lead={`Every link below was checked on ${new Date(SOURCES_RETRIEVED_AT).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Nothing here is imported into the app: opening a paper opens the provider's own PDF, and a PDF you read in another tab is not a timed exam.`}
      />

      <Notice tone="info" className="mb-5">
        UAT-UK offers the BMAT and TSA papers because those tests share a common history with TARA&rsquo;s
        reasoning components. They are useful practice, but they are not past TARA papers, and their
        difficulty is not calibrated to the current test.
      </Notice>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['all', 'TARA', 'BMAT', 'TSA'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'primary' : 'secondary'}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f}
          </Button>
        ))}
      </div>

      {grouped.reference.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold">Specification and official practice</h2>
          <ul className="grid list-none gap-2">
            {grouped.reference.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                reports={reportsBySource.get(source.id) ?? []}
                recording={recording === source.id}
                onToggleRecord={() => setRecording(recording === source.id ? null : source.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {grouped.papers.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">
            Archive papers{' '}
            <span className="font-normal text-foreground-subtle">({grouped.papers.length})</span>
          </h2>
          <ul className="grid list-none gap-2">
            {grouped.papers.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                reports={reportsBySource.get(source.id) ?? []}
                recording={recording === source.id}
                onToggleRecord={() => setRecording(recording === source.id ? null : source.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function SourceRow({
  source,
  reports,
  recording,
  onToggleRecord,
}: {
  source: Source
  reports: { id: string; at: number; label: string; correct: number | null; total: number | null; note: string }[]
  recording: boolean
  onToggleRecord: () => void
}) {
  return (
    <Card as="li" className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 sm:flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{source.title}</h3>
            <Badge tone={source.contentUse === 'interactive-approved' ? 'success' : 'neutral'}>
              {source.contentUse === 'interactive-approved' ? 'imported' : 'link only'}
            </Badge>
            {source.importStatus === 'not-imported' && source.keyUrl && (
              <Badge tone="info">answer key published</Badge>
            )}
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-foreground-muted">{source.note}</p>
          <p className="mt-1.5 text-xs text-foreground-subtle">
            {source.attribution} · checked {source.retrievedAt}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <a
            href={source.paperUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Open ↗
          </a>
          {source.keyUrl && (
            <a
              href={source.keyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-md border border-border-strong px-3 py-2 text-sm font-medium hover:bg-surface-muted"
            >
              Answer key ↗
            </a>
          )}
          <Button variant="quiet" size="sm" onClick={onToggleRecord}>
            {recording ? 'Cancel' : 'Record my result'}
          </Button>
        </div>
      </div>

      {recording && <SelfReportForm sourceId={source.id} onDone={onToggleRecord} />}

      {reports.length > 0 && (
        <ul className="mt-3 grid list-none gap-1.5 border-t border-border pt-3 text-sm">
          {reports.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">self-reported</Badge>
              <span className="tabular-nums text-foreground-subtle">
                {new Date(r.at).toLocaleDateString('en-GB')}
              </span>
              <span className="font-medium">{r.label}</span>
              {r.correct !== null && r.total !== null && (
                <span className="tabular-nums">
                  {r.correct}/{r.total}
                </span>
              )}
              {r.note && <span className="text-foreground-muted">{r.note}</span>}
              <Button
                variant="quiet"
                size="sm"
                className="ml-auto"
                onClick={() => void deleteSelfReport(r.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function SelfReportForm({ sourceId, onDone }: { sourceId: string; onDone: () => void }) {
  const [label, setLabel] = useState('Section 1, timed')
  const [correct, setCorrect] = useState('')
  const [total, setTotal] = useState('')
  const [note, setNote] = useState('')
  const [component, setComponent] = useState<ComponentId | ''>('')

  return (
    <form
      className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        void addSelfReport({
          sourceId,
          at: Date.now(),
          label: label.trim() || 'Attempt',
          correct: correct === '' ? null : Number(correct),
          total: total === '' ? null : Number(total),
          note: note.trim(),
          componentId: component === '' ? null : component,
        }).then(onDone)
      }}
    >
      <Field label="What did you do?" htmlFor={`label-${sourceId}`}>
        <input
          id={`label-${sourceId}`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Which component?" htmlFor={`component-${sourceId}`}>
        <select
          id={`component-${sourceId}`}
          value={component}
          onChange={(e) => setComponent(e.target.value as ComponentId | '')}
          className={inputClass}
        >
          <option value="">Not specified</option>
          <option value="critical-thinking">Critical Thinking</option>
          <option value="problem-solving">Problem Solving</option>
          <option value="writing">Writing</option>
        </select>
      </Field>
      <Field label="Correct" htmlFor={`correct-${sourceId}`}>
        <input
          id={`correct-${sourceId}`}
          type="number"
          min={0}
          value={correct}
          onChange={(e) => setCorrect(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Out of" htmlFor={`total-${sourceId}`}>
        <input
          id={`total-${sourceId}`}
          type="number"
          min={0}
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          className={inputClass}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Note" htmlFor={`note-${sourceId}`} hint="Recorded as self-reported. The app cannot verify it, and it is kept out of the marked-practice figures.">
          <input
            id={`note-${sourceId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
            placeholder="Ran out of time on the last five."
          />
        </Field>
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit">Save result</Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
