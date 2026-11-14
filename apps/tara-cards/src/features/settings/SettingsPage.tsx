import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, useContentIndex } from '@/app/AppContext'
import { db } from '@/storage/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { deletePack } from '@/storage/repo'
import { validateContentPack } from '@/content/validate'
import { SKILL_IDS } from '@/content/skills'
import {
  applyImport,
  downloadJson,
  exportBackup,
  previewImport,
  type ImportMode,
  type ImportPreview,
} from '@/storage/backup'
import { REVIEW_INTERVAL_DAYS } from '@/domain/types'
import { EVIDENCE } from '@/domain/aggregation'
import { WORD_LIMIT } from '@/domain/wordcount'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Field,
  Notice,
  PageHeader,
  inputClass,
} from '@/ui/primitives'

export function SettingsPage() {
  const { prefs, setPrefs } = useApp()
  const content = useContentIndex()
  const packs = useLiveQuery(() => db.packs.orderBy('importedAt').toArray(), [], []) ?? []

  const packInput = useRef<HTMLInputElement>(null)
  const backupInput = useRef<HTMLInputElement>(null)
  const [packMessage, setPackMessage] = useState<{ tone: 'success' | 'danger'; lines: string[] } | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [replaceConfirm, setReplaceConfirm] = useState('')
  const [importDone, setImportDone] = useState<string | null>(null)

  const handlePackFile = async (file: File) => {
    setPackMessage(null)
    let raw: unknown
    try {
      raw = JSON.parse(await file.text())
    } catch (err) {
      setPackMessage({ tone: 'danger', lines: [`${file.name} is not valid JSON: ${(err as Error).message}`] })
      return
    }
    const result = validateContentPack(raw, SKILL_IDS)
    if (!result.ok || !result.pack) {
      setPackMessage({
        tone: 'danger',
        lines: result.issues
          .filter((i) => i.severity === 'error')
          .map((i) => `${i.path}: ${i.message}`),
      })
      return
    }
    await db.packs.put({
      id: result.pack.id,
      name: result.pack.name,
      version: result.pack.version,
      importedAt: Date.now(),
      raw,
    })
    setPackMessage({
      tone: 'success',
      lines: [
        `Imported “${result.pack.name}”: ${result.pack.questions.length} questions, ${result.pack.writingPrompts.length} prompts, ${result.pack.sources.length} sources.`,
        ...(result.quarantined.length
          ? [`${result.quarantined.length} questions were quarantined and cannot enter scored practice.`]
          : []),
        ...result.issues.filter((i) => i.severity === 'warning').map((i) => `${i.path}: ${i.message}`),
      ],
    })
  }

  const handleBackupFile = async (file: File) => {
    setImportDone(null)
    try {
      const raw = JSON.parse(await file.text())
      setPreview(await previewImport(raw, new Set(content.questionById.keys())))
    } catch (err) {
      setPreview({
        ok: false,
        backup: null,
        errors: [`Not valid JSON: ${(err as Error).message}`],
        incoming: {},
        current: {},
        collisions: {},
        unknownQuestionIds: [],
      })
    }
  }

  return (
    <div>
      <PageHeader title="Settings" lead="Everything here is stored in this browser on this device." />

      {/* ------------------------- Study plan ------------------------- */}
      <Card className="p-4 sm:p-5">
        <h2 className="text-base font-semibold">Your plan</h2>
        <p className="mt-1 text-sm text-foreground-muted">All optional. Nothing is blocked if you skip it.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Test date" htmlFor="s-date">
            <input
              id="s-date"
              type="date"
              value={prefs.testDate ?? ''}
              onChange={(e) => void setPrefs({ testDate: e.target.value || null })}
              className={inputClass}
            />
          </Field>
          <Field label="Minutes available today" htmlFor="s-daily">
            <input
              id="s-daily"
              type="number"
              min={0}
              value={prefs.dailyMinutes ?? ''}
              onChange={(e) => void setPrefs({ dailyMinutes: e.target.value === '' ? null : Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Weekly target (minutes)" htmlFor="s-weekly">
            <input
              id="s-weekly"
              type="number"
              min={0}
              value={prefs.weeklyTargetMinutes ?? ''}
              onChange={(e) =>
                void setPrefs({ weeklyTargetMinutes: e.target.value === '' ? null : Number(e.target.value) })
              }
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      {/* --------------------------- Timing --------------------------- */}
      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Timing</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field
            label="Time multiplier"
            htmlFor="s-multiplier"
            hint="For extra time you are entitled to, or to build up speed gradually. Results are grouped by multiplier and never pooled with standard time."
          >
            <select
              id="s-multiplier"
              value={prefs.timing.multiplier}
              onChange={(e) => void setPrefs({ timing: { ...prefs.timing, multiplier: Number(e.target.value) } })}
              className={inputClass}
            >
              {[1, 1.25, 1.5, 2].map((m) => (
                <option key={m} value={m}>
                  ×{m} {m === 1 && '(standard)'}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Training mode"
            htmlFor="s-pausable"
            hint="Allows pausing a timed attempt. Paused attempts are labelled and left out of strict-timed comparisons."
          >
            <select
              id="s-pausable"
              value={prefs.timing.pausable ? 'yes' : 'no'}
              onChange={(e) => void setPrefs({ timing: { ...prefs.timing, pausable: e.target.value === 'yes' } })}
              className={inputClass}
            >
              <option value="no">Off — timed attempts run to the clock</option>
              <option value="yes">On — allow pausing (training only)</option>
            </select>
          </Field>
        </div>
        <Notice tone="neutral" className="mt-3">
          A module is 22 questions in 40 minutes, unused time does not carry over, and there is no
          deduction for a wrong answer. The essay has a {WORD_LIMIT}-word limit. Calculators,
          dictionaries and electronic spell-checkers are not permitted in the real test — the app
          switches off browser spellcheck where it can, but it cannot police anything outside itself.
        </Notice>
      </Card>

      {/* ------------------------ Presentation ------------------------ */}
      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Presentation</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Theme" htmlFor="s-theme">
            <select
              id="s-theme"
              value={prefs.theme}
              onChange={(e) => void setPrefs({ theme: e.target.value as typeof prefs.theme })}
              className={inputClass}
            >
              <option value="system">Match my system</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </Field>
          <Field label="Motion" htmlFor="s-motion">
            <select
              id="s-motion"
              value={prefs.reducedMotion ? 'reduced' : 'normal'}
              onChange={(e) => void setPrefs({ reducedMotion: e.target.value === 'reduced' })}
              className={inputClass}
            >
              <option value="normal">Follow my system setting</option>
              <option value="reduced">Always reduce motion</option>
            </select>
          </Field>
        </div>
      </Card>

      {/* --------------------------- Reports -------------------------- */}
      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Reporting</h2>
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={prefs.includeFixturesInProgress}
            onChange={(e) => void setPrefs({ includeFixturesInProgress: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
          />
          <span>
            <span className="font-medium">Include development fixtures in progress reports</span>
            <span className="mt-0.5 block text-foreground-muted">
              Off by default. Fixtures are original questions written to demonstrate the software; they
              are not official material and their difficulty is not calibrated.
            </span>
          </span>
        </label>

        <div className="mt-4 border-t border-border pt-3 text-sm">
          <h3 className="font-medium">How review scheduling works</h3>
          <ul className="mt-1.5 grid list-disc gap-1 pl-5 text-foreground-muted">
            <li>Wrong, unscored, or revealed early → back tomorrow.</li>
            <li>Correct but marked “unsure” → 3 days.</li>
            <li>Correct and confident → 7 days.</li>
            <li>Each later success moves up the ladder: {REVIEW_INTERVAL_DAYS.join(', ')} days.</li>
            <li>Any new error resets to tomorrow.</li>
          </ul>
          <p className="mt-2 text-xs text-foreground-subtle">
            These intervals are this app&rsquo;s configuration, not exam guidance. A status label needs{' '}
            {EVIDENCE.minForStatus} fresh first attempts before it appears at all.
          </p>
        </div>
      </Card>

      {/* ------------------------ Content packs ----------------------- */}
      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Content</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Content is versioned separately from your progress. Packs are re-validated every time the
          app loads, so a pack that no longer passes cannot quietly stay in use.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => packInput.current?.click()}>Import a content pack</Button>
          <ButtonLink to="/settings/coverage" variant="secondary">
            Coverage report
          </ButtonLink>
          <input
            ref={packInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handlePackFile(file)
              e.target.value = ''
            }}
          />
        </div>

        {packMessage && (
          <Notice tone={packMessage.tone === 'success' ? 'success' : 'danger'} className="mt-3">
            <ul className="grid list-disc gap-1 pl-5">
              {packMessage.lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </Notice>
        )}

        {content.rejectedPacks.length > 0 && (
          <Notice tone="danger" className="mt-3" title="Some stored packs no longer validate">
            <ul className="grid gap-2">
              {content.rejectedPacks.map((p) => (
                <li key={p.id}>
                  <span className="font-medium">{p.id}</span>
                  <ul className="mt-1 grid list-disc gap-0.5 pl-5">
                    {p.issues.slice(0, 5).map((i, n) => (
                      <li key={n}>
                        {i.path}: {i.message}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Notice>
        )}

        {content.unconfirmedDuplicates.length > 0 && (
          <Notice tone="warning" className="mt-3" title="Possible duplicates found">
            <p>
              These questions have identical content but are in different duplicate groups. Until
              someone confirms the link, meeting one will not stop the other counting as fresh.
            </p>
            <ul className="mt-2 grid list-disc gap-1 pl-5">
              {content.unconfirmedDuplicates.map((d) => (
                <li key={d.hash}>{d.questionIds.join(' · ')}</li>
              ))}
            </ul>
          </Notice>
        )}

        {packs.length > 0 && (
          <ul className="mt-3 grid list-none gap-2">
            {packs.map((pack) => (
              <li key={pack.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2.5 text-sm">
                <span className="font-medium">{pack.name}</span>
                <Badge tone="neutral">v{pack.version}</Badge>
                <span className="text-xs text-foreground-subtle">
                  imported {new Date(pack.importedAt).toLocaleDateString('en-GB')}
                </span>
                <Button
                  size="sm"
                  variant="quiet"
                  className="ml-auto"
                  onClick={() => {
                    if (confirm(`Remove the pack “${pack.name}”? Your attempt history is kept.`))
                      void deletePack(pack.id)
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* --------------------------- Backup --------------------------- */}
      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Backup</h2>
        <Notice tone="warning" className="mt-2">
          Everything you do here is stored in this browser, on this device. Clearing site data,
          switching browser or using a private window will lose it. Export a backup if it matters.
        </Notice>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={() =>
              void exportBackup().then((b) =>
                downloadJson(b, `tara-cards-backup-${new Date().toISOString().slice(0, 10)}.json`),
              )
            }
          >
            Export everything
          </Button>
          <Button variant="secondary" onClick={() => backupInput.current?.click()}>
            Import a backup
          </Button>
          <input
            ref={backupInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleBackupFile(file)
              e.target.value = ''
            }}
          />
        </div>

        {importDone && (
          <Notice tone="success" className="mt-3">
            {importDone}
          </Notice>
        )}

        {preview && !preview.ok && (
          <Notice tone="danger" className="mt-3" title="That file could not be read as a backup">
            <ul className="grid list-disc gap-1 pl-5">
              {preview.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </Notice>
        )}

        {preview?.ok && preview.backup && (
          <div className="mt-3 rounded-md border border-border-strong p-3">
            <h3 className="text-sm font-semibold">Before anything changes</h3>
            <p className="mt-1 text-xs text-foreground-subtle">
              Exported {new Date(preview.backup.exportedAt).toLocaleString('en-GB')}
            </p>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-foreground-subtle">
                  <th scope="col" className="py-1">Record</th>
                  <th scope="col" className="py-1 text-right">Here now</th>
                  <th scope="col" className="py-1 text-right">In the file</th>
                  <th scope="col" className="py-1 text-right">Same id</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(preview.incoming).map((key) => (
                  <tr key={key} className="border-t border-border">
                    <th scope="row" className="py-1 text-left font-normal">{key}</th>
                    <td className="py-1 text-right tabular-nums">{preview.current[key] ?? 0}</td>
                    <td className="py-1 text-right tabular-nums">{preview.incoming[key]}</td>
                    <td className="py-1 text-right tabular-nums">{preview.collisions[key] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {preview.unknownQuestionIds.length > 0 && (
              <Notice tone="warning" className="mt-3">
                {preview.unknownQuestionIds.length} attempts refer to questions that are not in the
                content loaded here ({preview.unknownQuestionIds.slice(0, 3).join(', ')}
                {preview.unknownQuestionIds.length > 3 ? '…' : ''}). They will be restored and counted,
                but you will not be able to open those questions until the matching content pack is
                imported too.
              </Notice>
            )}

            <fieldset className="mt-3">
              <legend className="text-sm font-medium">How should this be applied?</legend>
              <label className="mt-2 flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="mt-1 h-4 w-4 accent-[var(--primary)]"
                />
                <span>
                  <span className="font-medium">Merge</span> — add what is missing, keep everything
                  already here. Rows with the same id are left as they are.
                </span>
              </label>
              <label className="mt-2 flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-1 h-4 w-4 accent-[var(--primary)]"
                />
                <span>
                  <span className="font-medium">Replace</span> — delete everything here first, then
                  restore the file. This cannot be undone.
                </span>
              </label>
            </fieldset>

            {importMode === 'replace' && (
              <Field
                label="Type REPLACE to confirm"
                htmlFor="replace-confirm"
                hint={`This will permanently delete ${Object.values(preview.current).reduce((a, b) => a + b, 0)} local records.`}
              >
                <input
                  id="replace-confirm"
                  value={replaceConfirm}
                  onChange={(e) => setReplaceConfirm(e.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </Field>
            )}

            <div className="mt-3 flex gap-2">
              <Button
                disabled={importMode === 'replace' && replaceConfirm !== 'REPLACE'}
                onClick={() => {
                  if (!preview.backup) return
                  void applyImport(preview.backup, importMode).then(() => {
                    setImportDone(
                      importMode === 'merge'
                        ? 'Backup merged. Nothing that was already here was overwritten.'
                        : 'Everything was replaced with the contents of the backup.',
                    )
                    setPreview(null)
                    setReplaceConfirm('')
                  })
                }}
              >
                {importMode === 'merge' ? 'Merge this backup' : 'Replace everything'}
              </Button>
              <Button variant="secondary" onClick={() => setPreview(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ------------------------ AI feedback ------------------------- */}
      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="text-base font-semibold">Optional AI feedback</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Not configured, and not required. Every core feature — prompts, planning, drafting, the
          per-prompt checklists, the review screen — works without it.
        </p>
        <Field
          label="Feedback endpoint"
          htmlFor="s-ai"
          hint="A small server endpoint of your own. Credentials stay on that server; the app never holds an API key. Sending an essay is always an explicit action, and feedback is never offered inside a strictly timed session."
        >
          <input
            id="s-ai"
            type="url"
            placeholder="https://…/essay-feedback"
            value={prefs.aiFeedbackEndpoint ?? ''}
            onChange={(e) => void setPrefs({ aiFeedbackEndpoint: e.target.value || null })}
            className={inputClass}
          />
        </Field>
      </Card>

      {!['localhost', '127.0.0.1'].includes(window.location.hostname) && (
        <p className="mt-6 text-sm">
          <a href={`${import.meta.env.BASE_URL}__logout`} className="underline underline-offset-2">
            Sign out of this device
          </a>
        </p>
      )}

      <p className="mt-6 text-xs leading-relaxed text-foreground-subtle">
        TARA Cards is a personal study app. It is not produced, endorsed or checked by UAT-UK. See the{' '}
        <Link to="/library/sources" className="underline underline-offset-2">
          source list
        </Link>{' '}
        for the official material this app links to.
      </p>
    </div>
  )
}
