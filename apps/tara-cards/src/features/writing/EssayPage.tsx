import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useApp, useContentIndex } from '@/app/AppContext'
import { db } from '@/storage/db'
import type { Essay } from '@/domain/types'
import { EssayWorkspace } from './EssayWorkspace'
import { countWords } from '@/domain/wordcount'
import { downloadText, essayToPlainText } from '@/storage/backup'
import { deleteEssay } from '@/storage/repo'
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  EmptyState,
  Loading,
  Notice,
  PageHeader,
} from '@/ui/primitives'

export function EssayPage() {
  const { essayId } = useParams<{ essayId: string }>()
  const [params] = useSearchParams()
  const content = useContentIndex()
  const { prefs } = useApp()
  const [comparing, setComparing] = useState<[number, number] | null>(null)

  const essay = useLiveQuery<Essay | undefined, undefined>(
    () => (essayId ? db.essays.get(essayId) : Promise.resolve(undefined)),
    [essayId],
    undefined,
  )

  // The deadline is fixed the first time the page is opened with a preset, and
  // derived from the essay's own creation time so a refresh does not extend it.
  const deadlineAt = useMemo(() => {
    if (!essay) return null
    const minutes = Number(params.get('minutes'))
    if (!minutes || Number.isNaN(minutes)) return null
    return essay.createdAt + minutes * 60_000 * prefs.timing.multiplier
  }, [essay, params, prefs.timing.multiplier])

  if (essay === undefined) return <Loading label="Opening your draft" />
  if (!essay) return <EmptyState title="Draft not found">That essay no longer exists.</EmptyState>

  const prompt = content.promptById.get(essay.promptId)
  if (!prompt) {
    return (
      <Notice tone="warning" title="The prompt for this draft is not loaded">
        <p>
          This draft refers to prompt <code>{essay.promptId}</code>, which is not in the content
          currently loaded — probably because it came from a backup made with a different content
          pack. Your text is safe and can still be exported.
        </p>
        <div className="mt-3">
          <Button
            size="sm"
            onClick={() => downloadText(essayToPlainText(essay, essay.promptId), `tara-essay-${essay.id}.txt`)}
          >
            Export as text
          </Button>
        </div>
      </Notice>
    )
  }

  const isSubmitted = essay.status === 'submitted'

  return (
    <div>
      <Breadcrumb trail={[{ label: 'Writing', to: '/writing' }, { label: 'Essay' }]} />
      <PageHeader
        title={isSubmitted ? 'Review your response' : 'Write your response'}
        lead={
          isSubmitted
            ? 'Your submissions are kept side by side so you can see what changed. Nothing here is a mark — the real test does not score the essay either.'
            : undefined
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadText(essayToPlainText(essay, prompt.statement), `tara-essay-${essay.id}.txt`)}
          >
            Export as text
          </Button>
        }
      />

      {!isSubmitted && (
        <EssayWorkspace essay={essay} prompt={prompt} deadlineAt={deadlineAt} timing={essay.timing} />
      )}

      {isSubmitted && (
        <>
          <Card className="p-4">
            <p className="prose-reading text-base font-medium">{prompt.statement}</p>
            <ul className="mt-2 grid list-decimal gap-1 pl-5 text-sm text-foreground-muted">
              {prompt.requirements.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </Card>

          <section className="mt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                Submissions{' '}
                <span className="font-normal text-foreground-subtle">({essay.revisions.length})</span>
              </h2>
              {essay.revisions.length > 1 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setComparing(comparing ? null : [0, essay.revisions.length - 1])
                  }
                >
                  {comparing ? 'Show all' : 'Compare first and latest'}
                </Button>
              )}
            </div>

            <ul className="grid list-none gap-3">
              {(comparing ? [essay.revisions[comparing[0]], essay.revisions[comparing[1]]] : essay.revisions).map(
                (revision, i) => (
                  <Card as="li" key={revision.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">
                        {comparing ? (i === 0 ? 'First' : 'Latest') : `Submission ${i + 1}`}
                      </Badge>
                      <span className="text-xs text-foreground-subtle">
                        {new Date(revision.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <Badge tone={revision.truncated ? 'warning' : 'neutral'}>
                        {revision.wordCount} words
                      </Badge>
                      {revision.reason === 'expiry' && <Badge tone="warning">time ran out</Badge>}
                    </div>
                    {revision.truncated && (
                      <Notice tone="warning" className="mt-2">
                        The clock ran out with the draft over the limit. What is shown is the first 750
                        counted words, which is what was submitted. Your full text is archived below.
                      </Notice>
                    )}
                    <p className="prose-reading mt-3 whitespace-pre-wrap">{revision.text}</p>
                    {revision.archivedFullText && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-foreground-muted">
                          Full text as you wrote it ({countWords(revision.archivedFullText)} words)
                        </summary>
                        <p className="prose-reading mt-2 whitespace-pre-wrap text-foreground-muted">
                          {revision.archivedFullText}
                        </p>
                      </details>
                    )}
                  </Card>
                ),
              )}
            </ul>
          </section>

          <Card className="mt-4 p-4">
            <h2 className="text-sm font-semibold">Check it against the prompt</h2>
            <p className="mt-0.5 text-xs text-foreground-subtle">
              These questions belong to this prompt. Answer them honestly and rewrite — a second
              attempt at the same prompt is where the improvement happens.
            </p>
            <ul className="mt-2 grid list-none gap-2">
              {prompt.coaching.checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    id={`check-${essay.id}-${i}`}
                    className="mt-1 h-4 w-4 accent-[var(--primary)]"
                  />
                  <label htmlFor={`check-${essay.id}-${i}`}>{item}</label>
                </li>
              ))}
            </ul>
          </Card>

          {essay.plan.trim() && (
            <Card className="mt-4 p-4">
              <h2 className="text-sm font-semibold">Your plan</h2>
              <p className="prose-reading mt-2 whitespace-pre-wrap text-foreground-muted">{essay.plan}</p>
            </Card>
          )}

          <Notice tone="neutral" className="mt-4">
            <p className="font-medium">No AI feedback is configured</p>
            <p className="mt-1">
              If a provider is set up in Settings, an extra button appears here that sends this exact
              draft for qualitative feedback. Without one, the checklist above and a rewrite are the
              whole loop — and they are the part that actually works.
            </p>
          </Notice>

          <div className="mt-6">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm('Delete this essay and all its submissions? This cannot be undone.'))
                  void deleteEssay(essay.id)
              }}
            >
              Delete this essay
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
