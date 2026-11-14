import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useContentIndex } from '@/app/AppContext'
import { useAttempts, useExposedGroups, useReviewStates } from '@/app/hooks'
import { groupBy, questionState, uniqueQuestionCount } from '@/app/questionState'
import { isInteractive } from '@/domain/eligibility'
import { CardGrid, CardList, CollectionCard, QuestionPreviewCard } from '@/ui/cards'
import { Badge, EmptyState, Field, PageHeader, inputClass } from '@/ui/primitives'
import { SKILL_BY_ID } from '@/content/skills'

/**
 * The library is organised by reasoning skill, not by subject matter. A passage
 * about transport is not a "Transport" topic — subject context is searchable
 * metadata only.
 */
export function LibraryPage() {
  const content = useContentIndex()
  const attempts = useAttempts()
  const exposed = useExposedGroups()
  const reviews = useReviewStates()
  const [query, setQuery] = useState('')

  const attemptsByGroup = useMemo(() => groupBy(attempts, (a) => a.duplicateGroupId), [attempts])
  const reviewByGroup = useMemo(() => new Map(reviews.map((r) => [r.groupId, r])), [reviews])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return null
    return content.questions
      .filter((question) => {
        const skill = SKILL_BY_ID.get(question.primarySkillId)
        const source = content.sourceById.get(question.locator.sourceId)
        const haystack = [
          question.id,
          skill?.title ?? '',
          question.secondaryTags.join(' '),
          source?.title ?? '',
          source?.year ?? '',
          source?.exam ?? '',
          question.blocks
            .map((b) =>
              b.kind === 'paragraph' || b.kind === 'passage'
                ? b.text
                : b.kind === 'table'
                  ? b.caption
                  : b.kind === 'figure'
                    ? b.alt
                    : b.items.join(' '),
            )
            .join(' '),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
      .slice(0, 40)
  }, [content, query])

  return (
    <div>
      <PageHeader
        title="Library"
        lead="Three components, each holding the reasoning skills the test asks for. Open a skill to read its method, then practise it."
      />

      <Field label="Search" htmlFor="library-search" hint="Searches skills, question identifiers, sources, years, technique tags and question text.">
        <input
          id="library-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="assumptions, percentages, TSA 2020, fx-ct-flaw-01…"
          className={inputClass}
        />
      </Field>

      {results ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold">
            {results.length} {results.length === 1 ? 'match' : 'matches'} for “{query.trim()}”
          </h2>
          {results.length === 0 ? (
            <EmptyState title="Nothing matched">
              Try a skill name, a technique tag such as “percentages”, or a source year.
            </EmptyState>
          ) : (
            <CardList>
              {results.map((question) => {
                const state = questionState(question, attemptsByGroup, exposed, reviewByGroup)
                return (
                  <QuestionPreviewCard
                    key={question.id}
                    to={`/library/question/${question.id}`}
                    identifier={question.id}
                    skillTitle={SKILL_BY_ID.get(question.primarySkillId)?.title ?? question.primarySkillId}
                    state={state.label}
                    tone={state.tone}
                  />
                )
              })}
            </CardList>
          )}
        </section>
      ) : (
        <>
          <CardGrid className="mt-6 sm:grid-cols-1">
            {content.components.map((component) => {
              const skills = content.skills.filter((s) => s.componentId === component.id)
              const questions = content.questions.filter((q) => q.componentId === component.id)
              const available = questions.filter(isInteractive)
              const unseen = available.filter((q) => !exposed.has(q.duplicateGroupId))
              return (
                <CollectionCard
                  key={component.id}
                  to={`/library/component/${component.id}`}
                  title={component.name}
                  description={component.description}
                  accent={component.accent}
                  actionLabel="Open component"
                  meta={
                    component.id === 'writing' ? (
                      <>
                        {skills.length} skills · {content.prompts.length} prompts
                      </>
                    ) : (
                      <>
                        {skills.length} skills · {uniqueQuestionCount(available)} questions available ·{' '}
                        {uniqueQuestionCount(unseen)} unseen
                      </>
                    )
                  }
                />
              )
            })}
          </CardGrid>

          <section className="mt-8">
            <h2 className="text-sm font-semibold">Official material</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              The provider publishes the specification, a question guide, two practice tests in its own
              player, and an archive of BMAT and TSA Section 1 papers with answer keys. None of it is
              reproduced here — these are links.
            </p>
            <div className="mt-3">
              <Link
                to="/library/sources"
                className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-muted"
              >
                Browse {content.sources.length} sources
                <Badge tone="neutral">link only</Badge>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
