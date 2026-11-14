import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useContentIndex } from '@/app/AppContext'
import { useExposedGroups, useReportableAttempts } from '@/app/hooks'
import { uniqueQuestionCount } from '@/app/questionState'
import { isInteractive } from '@/domain/eligibility'
import { statsForSkill } from '@/domain/aggregation'
import { CardGrid, CollectionCard } from '@/ui/cards'
import { Breadcrumb, ButtonLink, EmptyState, PageHeader } from '@/ui/primitives'
import { StatusBadge } from '@/ui/status'
import type { ComponentId } from '@/domain/types'

export function ComponentPage() {
  const { componentId } = useParams<{ componentId: string }>()
  const content = useContentIndex()
  const attempts = useReportableAttempts()
  const exposed = useExposedGroups()

  const component = content.components.find((c) => c.id === componentId)
  const skills = useMemo(
    () => content.skills.filter((s) => s.componentId === componentId),
    [content.skills, componentId],
  )

  if (!component) {
    return <EmptyState title="Unknown component">That component does not exist.</EmptyState>
  }

  const isWriting = component.id === 'writing'

  return (
    <div>
      <Breadcrumb trail={[{ label: 'Library', to: '/library' }, { label: component.name }]} />
      <PageHeader
        title={component.name}
        lead={component.description}
        actions={
          isWriting ? (
            <ButtonLink to="/writing">Go to writing</ButtonLink>
          ) : (
            <ButtonLink to={`/practice?component=${component.id}`}>Practise this component</ButtonLink>
          )
        }
      />

      <CardGrid>
        {skills.map((skill) => {
          const questions = content.questions.filter((q) => q.primarySkillId === skill.id)
          const available = questions.filter(isInteractive)
          const unseen = available.filter((q) => !exposed.has(q.duplicateGroupId))
          const stats = statsForSkill(attempts, skill.id)
          return (
            <CollectionCard
              key={skill.id}
              to={`/library/skill/${skill.id}`}
              title={skill.title}
              description={skill.summary}
              accent={component.accent}
              actionLabel="Explore skill"
              badges={
                <StatusBadge status={stats.status} correct={stats.fresh.correct} n={stats.fresh.n} />
              }
              meta={
                isWriting ? (
                  <>Method guide, exercises and prompts</>
                ) : available.length === 0 ? (
                  <>No questions available yet — method guide only</>
                ) : (
                  <>
                    {uniqueQuestionCount(available)} available · {uniqueQuestionCount(unseen)} unseen
                    {stats.fresh.n > 0 && (
                      <>
                        {' '}
                        · {Math.round((stats.fresh.accuracy ?? 0) * 100)}% on {stats.fresh.n} fresh{' '}
                        {stats.fresh.n === 1 ? 'attempt' : 'attempts'}
                      </>
                    )}
                  </>
                )
              }
            />
          )
        })}
      </CardGrid>

      {!isWriting && (
        <p className="mt-6 text-xs text-foreground-subtle">
          Counts are unique questions, not the sum of overlapping tags: a question that trains two
          skills is stored once and counted once per skill card.
        </p>
      )}
    </div>
  )
}

export type { ComponentId }
