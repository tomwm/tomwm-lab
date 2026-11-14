import { Link } from 'react-router-dom'
import { useApp, useContentIndex } from '@/app/AppContext'
import { MODULE_QUESTION_COUNT, WRITING_PROMPT_CHOICES } from '@/domain/timing'
import { Badge, Breadcrumb, Card, Notice, PageHeader } from '@/ui/primitives'
import { SOURCES_RETRIEVED_AT } from '@/content/sources'

/**
 * An honest account of what this app can actually mark, as opposed to what it
 * can link to. This page is the answer to "is the question bank finished?" —
 * and it says no in specific, checkable terms.
 */
export function CoveragePage() {
  const content = useContentIndex()
  const { coverage } = useApp()
  const t = coverage.totals

  const ctInteractive = coverage.rows
    .filter((r) => r.componentId === 'critical-thinking')
    .reduce((a, r) => a + r.interactive, 0)
  const psInteractive = coverage.rows
    .filter((r) => r.componentId === 'problem-solving')
    .reduce((a, r) => a + r.interactive, 0)

  return (
    <div>
      <Breadcrumb trail={[{ label: 'Settings', to: '/settings' }, { label: 'Coverage' }]} />
      <PageHeader
        title="Content coverage"
        lead="What is actually available to practise inside the app, and what is only a link."
      />

      {t.officialInteractive === 0 ? (
        <Notice tone="warning" className="mb-5" title="No official questions are imported yet">
          <p>
            Every interactive question is a development fixture: original content written to
            demonstrate that marking, exposure tracking, review scheduling and reporting work. None
            of the {t.sources - 1} official sources has been imported.
          </p>
        </Notice>
      ) : (
        <Notice tone="info" className="mb-5" title="Imported for personal use">
          <p>
            {t.officialInteractive} official {t.officialInteractive === 1 ? 'question is' : 'questions are'}{' '}
            available to practise, from {t.importedSources - 1} imported{' '}
            {t.importedSources - 1 === 1 ? 'paper' : 'papers'}. They load from the gitignored{' '}
            <code>content-packs/</code> folder on this machine and must not be committed or deployed:
            UAT-UK prohibits sharing test content.
          </p>
          <p className="mt-2">
            {t.fixturesInteractive} development fixtures remain alongside them, labelled as such and
            excluded from Progress by default.
          </p>
        </Notice>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Questions in the app</h2>
          <dl className="mt-2 grid gap-1.5 text-sm">
            <Row label="Stored in total">{t.questions}</Row>
            <Row label="Available to practise">{t.interactive}</Row>
            <Row label="Of those, official">{t.officialInteractive}</Row>
            <Row label="Of those, development fixtures">{t.fixturesInteractive}</Row>
            <Row label="Quarantined">{t.quarantined}</Row>
            <Row label="Missing a worked explanation">{t.missingExplanations}</Row>
            <Row label="Distinct duplicate groups">{t.duplicateGroups}</Row>
            <Row label="Held out for rehearsal">{t.reservedForMock}</Row>
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold">Sources</h2>
          <dl className="mt-2 grid gap-1.5 text-sm">
            <Row label="Sources listed">{t.sources}</Row>
            <Row label="Link-only">{t.linkOnlySources}</Row>
            <Row label="Imported into the app">{t.importedSources}</Row>
            <Row label="Writing prompts">{t.prompts}</Row>
          </dl>
          <p className="mt-3 text-xs text-foreground-subtle">
            Every URL was checked on{' '}
            {new Date(SOURCES_RETRIEVED_AT).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            . Re-check them with <code>node scripts/verify-sources.mjs</code>.
          </p>
        </Card>
      </div>

      <Card className="mt-4 p-4">
        <h2 className="text-sm font-semibold">Can a full rehearsal run?</h2>
        <ul className="mt-2 grid list-none gap-1.5 text-sm">
          <RehearsalRow
            label="Critical Thinking"
            have={ctInteractive}
            need={MODULE_QUESTION_COUNT}
          />
          <RehearsalRow label="Problem Solving" have={psInteractive} need={MODULE_QUESTION_COUNT} />
          <RehearsalRow label="Writing prompts" have={t.prompts} need={WRITING_PROMPT_CHOICES} />
        </ul>
      </Card>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">By skill</h2>
        <div className="q-table-wrap">
          <table className="q-table text-sm">
            <caption className="sr-only">Interactive question coverage by skill</caption>
            <thead>
              <tr>
                <th scope="col">Skill</th>
                <th scope="col">Available</th>
                <th scope="col">Fixtures</th>
                <th scope="col">Official</th>
                <th scope="col">With explanation</th>
                <th scope="col">Quarantined</th>
                <th scope="col">Held out</th>
              </tr>
            </thead>
            <tbody>
              {coverage.rows.map((row) => (
                <tr key={row.skillId}>
                  <th scope="row" className="font-medium">
                    <Link to={`/library/skill/${row.skillId}`} className="underline underline-offset-2">
                      {row.title}
                    </Link>
                  </th>
                  <td className="tabular-nums">{row.interactive}</td>
                  <td className="tabular-nums">{row.fixtures}</td>
                  <td className="tabular-nums">{row.official}</td>
                  <td className="tabular-nums">{row.withExplanation}</td>
                  <td className="tabular-nums">{row.quarantined}</td>
                  <td className="tabular-nums">{row.reservedForMock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {coverage.emptySkillIds.length > 0 && (
          <p className="mt-2 text-xs text-warning">
            {coverage.emptySkillIds.length}{' '}
            {coverage.emptySkillIds.length === 1 ? 'skill has' : 'skills have'} no practisable question
            at all. Their method guides still work, and their pages say so rather than implying
            practice is available.
          </p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">Quarantined items</h2>
        {content.questions.filter((q) => q.availability === 'quarantined').length === 0 ? (
          <p className="text-sm text-foreground-muted">Nothing is quarantined.</p>
        ) : (
          <ul className="grid list-none gap-2">
            {content.questions
              .filter((q) => q.availability === 'quarantined')
              .map((q) => (
                <Card as="li" key={q.id} className="p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/library/question/${q.id}`} className="font-medium underline underline-offset-2">
                      {q.id}
                    </Link>
                    <Badge tone="warning">quarantined</Badge>
                  </div>
                  <p className="mt-1 text-foreground-muted">{q.quarantineReason}</p>
                </Card>
              ))}
          </ul>
        )}
      </section>

      <Card className="mt-6 p-4">
        <h2 className="text-sm font-semibold">Importing more</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
          The pack format and the review pipeline are documented in{' '}
          <code>docs/content-pack-schema.md</code>. An item only becomes practisable once it has a
          verified answer key and all four review flags are signed off: transcription, answer key,
          skill alignment and assets. Missing answers are never inferred with a model, and an item
          whose figure is missing is quarantined rather than shown.
        </p>
      </Card>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-foreground-subtle">{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  )
}

function RehearsalRow({ label, have, need }: { label: string; have: number; need: number }) {
  const ok = have >= need
  return (
    <li className="flex flex-wrap items-center gap-2">
      <Badge tone={ok ? 'success' : 'warning'}>{ok ? 'ready' : 'short'}</Badge>
      <span className="font-medium">{label}</span>
      <span className="tabular-nums text-foreground-muted">
        {have} of {need}
      </span>
      {!ok && <span className="text-xs text-foreground-subtle">needs {need - have} more</span>}
    </li>
  )
}
