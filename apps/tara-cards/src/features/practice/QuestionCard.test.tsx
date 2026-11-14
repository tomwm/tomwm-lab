import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QuestionCard } from './QuestionCard'
import { AppProvider } from '@/app/AppContext'
import { db } from '@/storage/db'
import { DEFAULT_TIMING } from '@/domain/sessions'
import { FIXTURE_QUESTIONS } from '@/content/fixtures'

const question = FIXTURE_QUESTIONS.find((q) => q.id === 'fx-ct-conclusion-01')!
const noExplanation = FIXTURE_QUESTIONS.find((q) => q.id === 'fx-ps-no-explanation-01')!

function renderCard(props: Partial<React.ComponentProps<typeof QuestionCard>> = {}) {
  return render(
    <MemoryRouter>
      <AppProvider>
        <QuestionCard
          question={question}
          mode="learning"
          sessionId="ses-test"
          exposedGroupsAtStart={[]}
          timing={DEFAULT_TIMING}
          {...props}
        />
      </AppProvider>
    </MemoryRouter>,
  )
}

beforeEach(async () => {
  await Promise.all([db.attempts.clear(), db.exposures.clear(), db.reviewStates.clear()])
})

describe('attempt and reveal', () => {
  it('does not reveal correctness on selection alone', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(await screen.findByRole('radio', { name: /Councils that judge a library/ }))
    expect(screen.queryByText('Correct')).not.toBeInTheDocument()
    expect(screen.queryByText(/Explanation/)).not.toBeInTheDocument()
  })

  it('marks the answer only when the learner checks it, and persists once', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(await screen.findByRole('radio', { name: /Councils that judge a library/ }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))

    expect(await screen.findByText('Correct')).toBeInTheDocument()
    expect(screen.getByText('Fresh first attempt')).toBeInTheDocument()
    await waitFor(async () => expect(await db.attempts.count()).toBe(1))
  })

  it('records a reveal as exposure without a score', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(await screen.findByRole('button', { name: 'Reveal without answering' }))

    expect(await screen.findByText('Not scored')).toBeInTheDocument()
    expect(screen.getByText('Revealed without answering')).toBeInTheDocument()
    expect(screen.queryByText('Repeat practice')).not.toBeInTheDocument()

    const attempt = await db.attempts.toCollection().first()
    expect(attempt?.outcome).toBe('unscored')
    expect(attempt?.freshFirstAttempt).toBe(false)
    const reasons = (await db.exposures.toArray()).map((e) => e.reason)
    expect(reasons).toContain('answer-revealed')
  })

  it('shows the recorded attempt again after a remount, without submitting twice', async () => {
    const user = userEvent.setup()
    const { unmount } = renderCard()
    await user.click(await screen.findByRole('radio', { name: /Councils that judge a library/ }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await screen.findByText('Correct')
    unmount()

    renderCard()
    expect(await screen.findByText('Correct')).toBeInTheDocument()
    await waitFor(async () => expect(await db.attempts.count()).toBe(1))
  })

  it('says so honestly when there is a key but no explanation', async () => {
    const user = userEvent.setup()
    renderCard({ question: noExplanation })
    await user.click(await screen.findByRole('radio', { name: /18 minutes/ }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))

    expect(await screen.findByText('Worked explanation not yet available')).toBeInTheDocument()
    expect(screen.getByText(/none has been invented to fill the gap/)).toBeInTheDocument()
  })

  it('is fully operable from the keyboard', async () => {
    const user = userEvent.setup()
    renderCard()
    await screen.findByRole('radio', { name: /Libraries lend fewer books/ })

    // Tab into the radio group, choose with the arrow keys, then reach the button.
    for (let i = 0; i < 8 && (document.activeElement as HTMLInputElement)?.type !== 'radio'; i++) {
      await user.tab()
    }
    expect(document.activeElement).toHaveAttribute('type', 'radio')

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    const selected = screen.getAllByRole('radio').find((r) => (r as HTMLInputElement).checked)
    expect(selected).toBeDefined()

    // The check button is reachable by tabbing on from the group.
    for (let i = 0; i < 12 && document.activeElement?.textContent !== 'Check answer'; i++) {
      await user.tab()
    }
    expect(document.activeElement).toHaveTextContent('Check answer')
    await user.keyboard('{Enter}')

    expect(await screen.findByText(/^(Correct|Incorrect)$/)).toBeInTheDocument()
  })

  it('announces the outcome to a screen reader without moving focus', async () => {
    const user = userEvent.setup()
    renderCard()
    const option = await screen.findByRole('radio', { name: /Councils that judge a library/ })
    await user.click(option)

    const check = screen.getByRole('button', { name: 'Check answer' })
    check.focus()
    await user.click(check)

    await screen.findByText('Correct')
    const live = document.querySelector('[aria-live="polite"]')
    expect(live?.textContent).toContain('Correct.')
    expect(live?.textContent).toContain('explanation has opened')

    // The button the learner pressed has gone, so focus must land somewhere
    // deliberate — the result — rather than falling back to the document.
    const result = screen.getByRole('group', { name: 'Result and explanation' })
    await waitFor(() => expect(document.activeElement).toBe(result))
    expect(document.activeElement).not.toBe(document.body)
  })

  it('does not offer checking or revealing inside a timed module', async () => {
    renderCard({ mode: 'exam' })
    await screen.findByRole('radio', { name: /Libraries lend fewer books/ })
    expect(screen.queryByRole('button', { name: 'Check answer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reveal without answering' })).not.toBeInTheDocument()
    expect(screen.getByText(/Nothing is marked until the module is submitted/)).toBeInTheDocument()
  })
})
