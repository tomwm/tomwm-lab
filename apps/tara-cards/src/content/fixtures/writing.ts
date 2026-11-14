import type { WritingPrompt } from '@/domain/types'
import { writingFixture } from './builder'

/**
 * Development fixtures — Writing prompts.
 *
 * Original prompts written for this app. They are not official TARA prompts.
 * The three tasks follow the official Writing Task structure [S5]: explain the
 * statement, argue against it, say how far you agree. The coaching notes and
 * checklists are specific to each prompt.
 *
 * Nothing here is a model essay. The coaching panel offers several possible
 * approaches, and revealing it marks the prompt as exposed.
 */
export const WRITING_FIXTURES: WritingPrompt[] = [
  writingFixture({
    id: 'fx-wr-prompt-01',
    statement: '"A society should be judged by how it treats its weakest members."',
    requirements: [
      'Explain what you think is meant by the statement.',
      'Give a reasoned argument against the statement.',
      'To what extent do you agree with the statement?',
    ],
    approaches: [
      {
        heading: 'Defend it as a moral test, not a description',
        body: 'Separate "is judged" from "ought to be judged", then defend the second. The strength of this route is that it sidesteps the easy objection that societies are in fact judged by wealth or power. You then have to say why vulnerability is the right test rather than one test among many.',
      },
      {
        heading: 'Accept it as necessary but not sufficient',
        body: 'Argue that treatment of the weakest is a floor: a society that fails it cannot be well ordered, but passing it does not make a society good. This is a narrower claim and easier to defend, provided you say plainly which half of the original you are rejecting.',
      },
      {
        heading: 'Challenge the category',
        body: 'Ask who counts as "weakest" — the poorest, the least powerful, the least well, future generations? If the category shifts, the test changes. This route is strong on definition and weak on verdict, so plan the judgement first if you take it.',
      },
    ],
    counterpoints: [
      'A society might treat its most vulnerable well while being unjust in other ways — say, to a neighbouring country.',
      'The claim can be read as a truism: almost any moral theory cares about the vulnerable, so the test may not distinguish between societies at all.',
      'Focusing on the weakest may crowd out other obligations, such as those to the people who fund the provision.',
    ],
    checklist: [
      'Have you said which reading of "judged" you are working with?',
      'Have you defined "weakest members" clearly enough that a reader could apply it?',
      'Is your position a floor, a full test, or a rejection — and is that stated?',
      'Did you answer the objection you raised, rather than only stating it?',
      'Does your conclusion match the strength of the argument you actually made?',
    ],
    skillIds: ['wr-interpret-claim', 'wr-define-terms', 'wr-counterargument', 'wr-judgement'],
  }),
  writingFixture({
    id: 'fx-wr-prompt-02',
    statement: '"Expertise deserves more weight in public decisions than public opinion does."',
    requirements: [
      'Explain what you think is meant by the statement.',
      'Give a reasoned argument against the statement.',
      'To what extent do you agree with the statement?',
    ],
    approaches: [
      {
        heading: 'Split the decision into two questions',
        body: 'Distinguish questions of fact — what a policy will do — from questions of value — whether that outcome is worth its cost. Expertise has authority over the first and none over the second. This gives you a clean basis for weighing, and a verdict that is neither "experts decide" nor "the public decides".',
      },
      {
        heading: 'Argue from legitimacy rather than accuracy',
        body: 'Grant that experts are more often right, then argue that a decision imposed without consent is unstable even when correct. The strength here is that it concedes the other side’s best point; the risk is sliding into the claim that popularity makes a policy right.',
      },
      {
        heading: 'Argue from the track record',
        body: 'Test both sides against cases where each went badly. This is concrete, but it needs examples you can describe accurately, and it invites the reply that you chose your cases.',
      },
    ],
    counterpoints: [
      'Experts disagree with each other, so "follow the experts" is often not an instruction at all.',
      'Public opinion is itself shaped by expert claims, so the two are not independent.',
      'On questions of value there is no expertise to defer to, however technical the subject looks.',
    ],
    checklist: [
      'Did you name the basis on which you are weighing the two, rather than listing both?',
      'Did you distinguish questions of fact from questions of value anywhere?',
      'Is your strongest objection given in its best form, not a weak version?',
      'Does the verdict say what would change your mind?',
      'Have you avoided treating "the experts" as a single body with one view?',
    ],
    skillIds: ['wr-weighing', 'wr-counterargument', 'wr-judgement', 'wr-examples'],
  }),
  writingFixture({
    id: 'fx-wr-prompt-03',
    statement: '"There is no such thing as a harmless lie."',
    requirements: [
      'Explain what you think is meant by the statement.',
      'Give a reasoned argument against the statement.',
      'To what extent do you agree with the statement?',
    ],
    approaches: [
      {
        heading: 'Defend it through cumulative harm',
        body: 'Argue that individual lies look harmless only because the harm is spread thin: each one slightly erodes the reliability of testimony that everyone depends on. The strength is that it explains away the obvious counterexamples; the cost is that "harm" is doing unusual work and you must say so.',
      },
      {
        heading: 'Reject it with a clear counterexample',
        body: 'Take a case — a surprise party, a compliment about a gift — and argue the harm is genuinely zero or is outweighed. You will need to say what "harmless" means precisely enough that your case clearly falls inside it.',
      },
      {
        heading: 'Distinguish harm from wrong',
        body: 'Concede that some lies harm nobody, but argue they can still wrong the person lied to by treating them as someone who cannot handle the truth. This reframes the claim rather than answering it, so say explicitly that you are doing so.',
      },
    ],
    counterpoints: [
      'If every lie is harmful, the claim risks becoming true by definition rather than by argument.',
      'Harms that are tiny and diffuse may not be harms in any sense that should guide behaviour.',
      'Some lies prevent larger harms, which raises whether the claim is about harm at all or about permissibility.',
    ],
    checklist: [
      'Have you stated what "harmless" means in your essay, and kept to it?',
      'Did you test the claim against a real case rather than asserting it?',
      'If you relied on cumulative harm, did you say why tiny diffuse harms count?',
      'Is your verdict conditional, and are the conditions stated?',
      'Did you avoid making the claim true by definition?',
    ],
    skillIds: ['wr-define-terms', 'wr-examples', 'wr-counterargument', 'wr-judgement'],
  }),
]

/** Short planning exercises: practice one move rather than a whole essay. */
export interface PlanningExercise {
  id: string
  title: string
  skillId: string
  minutes: number
  brief: string
  guidance: string[]
}

export const PLANNING_EXERCISES: PlanningExercise[] = [
  {
    id: 'ex-wr-steelman',
    title: 'Steelman in three sentences',
    skillId: 'wr-counterargument',
    minutes: 6,
    brief:
      'Pick any prompt above and take the position you do NOT hold. Write the strongest three sentences you can for it: the objection, its best supporting reason, and the example that makes it bite.',
    guidance: [
      'Do not write anything in reply. The exercise is only the objection.',
      'If you can knock it down in one line, it is not the strongest version yet.',
      'Name the person who would make this argument, and write as they would.',
    ],
  },
  {
    id: 'ex-wr-five-line-plan',
    title: 'The five-line plan',
    skillId: 'wr-planning-editing',
    minutes: 8,
    brief:
      'Choose a prompt and plan it in three short groups, one per part of the task: what the statement means, the strongest case against it, and how far you agree. Nothing else.',
    guidance: [
      'Write the verdict before the moves, then check the moves actually reach it.',
      'Three moves is the right number for 750 words. Six is a plan for an essay you will not finish.',
      'If a move does not change the verdict, cut it.',
    ],
  },
  {
    id: 'ex-wr-definition',
    title: 'The definition that earns its place',
    skillId: 'wr-define-terms',
    minutes: 5,
    brief:
      'Take the key term in any prompt. Write a two-sentence definition, then name one case it includes and one case it excludes.',
    guidance: [
      'If you cannot name an excluded case, the definition is too loose to be useful.',
      'Avoid dictionary definitions — you want a boundary you will argue from.',
      'Check the definition does not make the prompt trivially true or trivially false.',
    ],
  },
]
