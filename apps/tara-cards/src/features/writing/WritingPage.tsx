import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, useContentIndex } from '@/app/AppContext'
import { useEssays, useExposedGroups } from '@/app/hooks'
import { createEssay } from '@/storage/repo'
import { PLANNING_EXERCISES } from '@/content/fixtures'
import { WRITING_PLAN_PRESET_MINUTES, WRITING_PRESET_MINUTES } from '@/domain/timing'
import { CardGrid, CollectionCard } from '@/ui/cards'
import { Badge, Button, ButtonLink, Card, EmptyState, Notice, PageHeader } from '@/ui/primitives'
import type { WritingPrompt } from '@/domain/types'

export function WritingPage() {
  const content = useContentIndex()
  const { prefs } = useApp()
  const essays = useEssays()
  const exposed = useExposedGroups()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const writingSkills = content.skills.filter((s) => s.componentId === 'writing')
  const drafts = essays.filter((e) => e.status === 'draft')
  const submitted = essays.filter((e) => e.status === 'submitted')

  const begin = async (prompt: WritingPrompt, minutes: number | null) => {
    setBusy(true)
    try {
      const essay = await createEssay({
        promptId: prompt.id,
        promptVersion: prompt.version,
        sessionId: null,
        timing:
          minutes === null
            ? { kind: 'untimed', multiplier: prefs.timing.multiplier, pausable: true }
            : { kind: 'soft', multiplier: prefs.timing.multiplier, pausable: false },
      })
      navigate(`/writing/essay/${essay.id}?minutes=${minutes ?? ''}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Writing"
        lead="One response, chosen from three prompts: explain what the statement means, give a reasoned argument against it, and say how far you agree. 40 minutes, at most 750 words. UAT-UK passes it to universities unscored, so there is no mark here to chase — only whether the argument holds."
      />

      {drafts.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">Continue a draft</h2>
          <ul className="grid list-none gap-2">
            {drafts.map((essay) => {
              const prompt = content.promptById.get(essay.promptId)
              return (
                <Card as="li" key={essay.id} className="p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="prose-reading text-sm font-medium">
                        {prompt?.statement ?? essay.promptId}
                      </p>
                      <p className="mt-1 text-xs text-foreground-subtle">
                        {essay.wordCount} words ·{' '}
                        {essay.lastSavedAt
                          ? `saved ${new Date(essay.lastSavedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`
                          : 'not saved yet'}
                      </p>
                    </div>
                    <ButtonLink to={`/writing/essay/${essay.id}`} size="sm">
                      Continue draft
                    </ButtonLink>
                  </div>
                </Card>
              )
            })}
          </ul>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold">Prompts</h2>
        <ul className="grid list-none gap-3">
          {content.prompts.map((prompt) => {
            const isExposed = exposed.has(prompt.id)
            return (
              <Card as="li" key={prompt.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="prose-reading text-base font-medium">{prompt.statement}</p>
                  <div className="flex shrink-0 gap-1.5">
                    {prompt.provenance === 'app-fixture' && (
                      <Badge tone="warning" title="Written for this app. Not an official prompt.">
                        Development fixture
                      </Badge>
                    )}
                    {prompt.provenance === 'official' && (
                      <Badge tone="info" title="The sample Writing Task prompt from UAT-UK's TARA question guide.">
                        Official sample
                      </Badge>
                    )}
                    {isExposed && <Badge tone="info">Approaches seen</Badge>}
                  </div>
                </div>
                <ul className="mt-2 grid list-decimal gap-1 pl-5 text-sm text-foreground-muted">
                  {prompt.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" disabled={busy} onClick={() => void begin(prompt, WRITING_PRESET_MINUTES)}>
                    Write for {WRITING_PRESET_MINUTES} minutes
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void begin(prompt, WRITING_PLAN_PRESET_MINUTES)}
                  >
                    Plan for {WRITING_PLAN_PRESET_MINUTES} minutes
                  </Button>
                  <Button size="sm" variant="quiet" disabled={busy} onClick={() => void begin(prompt, null)}>
                    Write untimed
                  </Button>
                </div>
              </Card>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-foreground-subtle">
          The Writing Task is 40 minutes in the real test. UAT-UK recommends planning for 5 to 10
          minutes before you start writing, grouping your ideas around the three parts of the task.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold">Short exercises</h2>
        <CardGrid>
          {PLANNING_EXERCISES.map((exercise) => (
            <Card as="li" key={exercise.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{exercise.title}</h3>
                <Badge tone="neutral">{exercise.minutes} min</Badge>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{exercise.brief}</p>
              <ul className="mt-2 grid list-disc gap-1 pl-5 text-xs text-foreground-subtle">
                {exercise.guidance.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </Card>
          ))}
        </CardGrid>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold">Writing skills</h2>
        <CardGrid>
          {writingSkills.map((skill) => (
            <CollectionCard
              key={skill.id}
              to={`/library/skill/${skill.id}`}
              title={skill.title}
              description={skill.summary}
              accent="wr"
              actionLabel="Explore skill"
            />
          ))}
        </CardGrid>
      </section>

      {submitted.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Submitted work</h2>
          <ul className="grid list-none gap-2">
            {submitted.map((essay) => {
              const prompt = content.promptById.get(essay.promptId)
              const last = essay.revisions.at(-1)
              return (
                <Card as="li" key={essay.id} className="p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="prose-reading text-sm font-medium">{prompt?.statement ?? essay.promptId}</p>
                      <p className="mt-1 text-xs text-foreground-subtle">
                        {essay.revisions.length} {essay.revisions.length === 1 ? 'submission' : 'submissions'} ·{' '}
                        {last?.wordCount ?? 0} words
                        {last?.truncated && ' · truncated at the limit'}
                      </p>
                    </div>
                    <ButtonLink to={`/writing/essay/${essay.id}`} size="sm" variant="secondary">
                      Review
                    </ButtonLink>
                  </div>
                </Card>
              )
            })}
          </ul>
        </section>
      ) : (
        drafts.length === 0 && (
          <EmptyState title="No writing yet">
            Start with an eight-minute plan before committing to a full response — the plan is where
            the essay is won.
          </EmptyState>
        )
      )}

      <Notice tone="neutral" className="mt-6">
        Optional AI feedback is not configured, so it is not offered. Every part of the writing
        workspace — prompts, planning, drafting, the per-prompt checklist and the review screen —
        works without it.
      </Notice>
    </div>
  )
}
