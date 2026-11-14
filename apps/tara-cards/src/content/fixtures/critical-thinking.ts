import type { Question } from '@/domain/types'
import { fixture, opts, p } from './builder'

/**
 * Development fixtures — Critical Thinking.
 * Original content written for this app. Not official questions, not
 * calibrated, and excluded from performance reports by default.
 */
export const CT_FIXTURES: Question[] = [
  fixture({
    id: 'fx-ct-conclusion-01',
    component: 'critical-thinking',
    skill: 'ct-main-conclusion',
    blocks: [
      p(
        'Libraries lend far fewer books than they did twenty years ago. Yet visitor numbers have risen, because people now come to use the computers, to attend free classes, and to sit somewhere warm. Councils that judge a library by its lending figures alone are therefore using the wrong measure.',
      ),
      p('Which of the following best expresses the main conclusion of the argument?'),
    ],
    options: opts([
      ['A', 'Libraries lend fewer books than they did twenty years ago.'],
      ['B', 'Visitor numbers at libraries have risen.'],
      ['C', 'People use libraries for computers, classes and warmth.'],
      ['D', 'Councils that judge a library by its lending figures alone are using the wrong measure.'],
      ['E', 'Councils should increase the funding they give to libraries.'],
    ]),
    answer: 'D',
    why: [
      'Everything else in the passage is offered in support of D, and the signal word "therefore" points straight at it.',
      'A, B and C are the evidence. E is a recommendation the passage never makes — it argues about how libraries should be measured, not about how much they should be given.',
    ],
    distractors: [
      ['A', 'True, and the first sentence — but it is a reason, not the point being argued for.'],
      ['E', 'A tempting next step, but the passage stops at the measure, not the money.'],
    ],
    method: 'Test each candidate with "because": the conclusion is the one the others support.',
  }),
  fixture({
    id: 'fx-ct-conclusion-02',
    component: 'critical-thinking',
    skill: 'ct-main-conclusion',
    blocks: [
      p(
        'Electric cars produce no exhaust emissions. But manufacturing their batteries is energy-intensive, and where electricity is generated mostly from coal, a new electric car may need years of driving before it has caused less pollution overall than the petrol car it replaced. Buying an electric car is not automatically the greener choice.',
      ),
      p('Which of the following best expresses the main conclusion of the argument?'),
    ],
    options: opts([
      ['A', 'Electric cars produce no exhaust emissions.'],
      ['B', 'Manufacturing car batteries is energy-intensive.'],
      ['C', 'Buying an electric car is not automatically the greener choice.'],
      ['D', 'Electric cars are worse for the environment than petrol cars.'],
      ['E', 'Countries should stop generating electricity from coal.'],
    ]),
    answer: 'C',
    why: [
      'C is the claim the two pieces of evidence are working towards, and the word "automatically" matches the passage’s careful hedging.',
      'D is the same idea turned up too far: the passage says "not automatically greener", not "worse".',
    ],
    distractors: [
      ['D', 'The classic overstatement trap — a stronger version of the real conclusion.'],
      ['E', 'A policy the passage neither states nor argues for.'],
    ],
    method: 'When two options differ only in strength, prefer the one that matches the passage’s own hedging.',
  }),
  fixture({
    id: 'fx-ct-inference-01',
    component: 'critical-thinking',
    skill: 'ct-inference',
    blocks: [
      p(
        'All of the runners who finished the race in under three hours had trained with the club. Some club members did not enter the race at all.',
      ),
      p('Which of the following must be true?'),
    ],
    options: opts([
      ['A', 'Everyone who trained with the club finished the race in under three hours.'],
      ['B', 'Some runners who finished in under three hours had not trained with the club.'],
      ['C', 'Anyone who did not train with the club did not finish in under three hours.'],
      ['D', 'Every club member who entered the race finished in under three hours.'],
      ['E', 'Most of the runners who finished the race had trained with the club.'],
    ]),
    answer: 'C',
    why: [
      'The first sentence says: finished under three hours → trained with the club.',
      'C is the contrapositive of that conditional — did not train with the club → did not finish under three hours — so it must be true.',
      'A reverses the conditional. B contradicts it. D and E go beyond what was said about sub-three-hour finishers.',
    ],
    distractors: [
      ['A', 'The reversed conditional — the single most common wrong answer in inference questions.'],
      ['E', 'Plausible, but the passage says nothing about finishers who took over three hours.'],
    ],
    method: 'Write the conditional as an arrow, then look for its contrapositive among the options.',
  }),
  fixture({
    id: 'fx-ct-inference-02',
    component: 'critical-thinking',
    skill: 'ct-inference',
    blocks: [
      p('The museum is open on every day that the café is open. The café is closed on Mondays.'),
      p('Which of the following must be true?'),
    ],
    options: opts([
      ['A', 'The museum is closed on Mondays.'],
      ['B', 'On any day the museum is closed, the café is also closed.'],
      ['C', 'The museum is open every day of the week.'],
      ['D', 'The café is open on every day that the museum is open.'],
      ['E', 'The museum and the café are open on exactly the same days.'],
    ]),
    answer: 'B',
    why: [
      'The rule is: café open → museum open. B is its contrapositive: museum closed → café closed.',
      'A does not follow: the café being closed on Mondays tells you nothing about the museum that day.',
      'D and E both reverse the rule, which only runs in one direction.',
    ],
    distractors: [
      ['A', 'Feels like it follows, but the conditional says nothing about days the café is shut.'],
      ['E', 'Turns a one-way rule into a two-way one.'],
    ],
    method: 'One-way conditionals only give you one extra fact: the contrapositive.',
  }),
  fixture({
    id: 'fx-ct-assumption-01',
    component: 'critical-thinking',
    skill: 'ct-assumptions',
    // Also useful when practising strengthening and weakening: the gap this
    // question turns on is exactly what new evidence would attack.
    tags: ['ct-strengthen-weaken'],
    blocks: [
      p(
        'Pupils at Greenhill who attend the breakfast club score higher in end-of-year tests than pupils who do not. The school should therefore open the breakfast club to the whole year group, in order to raise results across the year.',
      ),
      p('Which of the following is an assumption the argument depends on?'),
    ],
    options: opts([
      ['A', 'The breakfast club is inexpensive to run.'],
      ['B', 'The higher scores are produced by the breakfast club, rather than by something that already distinguishes the pupils who attend it.'],
      ['C', 'Every pupil in the year group would want to attend a breakfast club.'],
      ['D', 'Greenhill’s results are currently below the national average.'],
      ['E', 'Breakfast is the most important meal of the day.'],
    ]),
    answer: 'B',
    why: [
      'Negate B: the difference in scores comes from something else about the pupils who attend — say, more organised households. Then extending the club would not raise results, and the argument collapses. So B is necessary.',
      'A would make the plan easier, but the argument is about results, not cost. C and D are not needed. E is a slogan, not a step in this reasoning.',
    ],
    distractors: [
      ['A', 'Helpful, but not something the argument depends on — a necessary assumption must break the argument when denied.'],
      ['E', 'Sounds relevant to breakfast, does no work in this particular argument.'],
    ],
    method: 'Use the negation test: deny the candidate and see whether the argument still stands.',
  }),
  fixture({
    id: 'fx-ct-assumption-02',
    component: 'critical-thinking',
    skill: 'ct-assumptions',
    blocks: [
      p(
        'This bridge has carried traffic for a hundred and fifty years without ever failing. It is therefore safe to keep running heavy lorries across it.',
      ),
      p('Which of the following is an assumption the argument depends on?'),
    ],
    options: opts([
      ['A', 'The bridge was designed by a competent engineer.'],
      ['B', 'Heavy lorries are the only vehicles that currently use the bridge.'],
      ['C', 'Nothing about the bridge or its traffic has changed in a way that makes its past record a poor guide to its present condition.'],
      ['D', 'No comparable bridge in the region has ever failed.'],
      ['E', 'Repairing the bridge would be expensive.'],
    ]),
    answer: 'C',
    why: [
      'The argument runs from a past record to a present judgement, so it needs the past to still be a guide.',
      'Negate C — the bridge has corroded badly, or lorries are now three times heavier than they were — and the inference from "has not failed" to "is safe" fails immediately.',
    ],
    distractors: [
      ['A', 'A reason the bridge might be sound, but not something this argument relies on.'],
      ['D', 'About other bridges; the argument is entirely about this one.'],
    ],
    method: 'Arguments from a track record always assume the conditions have not changed.',
  }),
  fixture({
    id: 'fx-ct-weaken-01',
    component: 'critical-thinking',
    skill: 'ct-strengthen-weaken',
    tags: ['ct-assumptions'],
    blocks: [
      p(
        'Since the council introduced a 20mph limit on Mill Road, reported collisions there have fallen by a third. The lower limit has made the road safer.',
      ),
      p('Which of the following, if true, most weakens the argument?'),
    ],
    options: opts([
      ['A', 'The 20mph limit was unpopular with drivers who use Mill Road.'],
      ['B', 'Traffic on Mill Road fell by about a third over the same period, after a nearby junction was closed for rebuilding.'],
      ['C', 'Some drivers on Mill Road still exceed the 20mph limit.'],
      ['D', 'The scheme cost the council more than it had budgeted for.'],
      ['E', 'Collision reports rose slightly on two other roads in the city.'],
    ]),
    answer: 'B',
    why: [
      'The argument treats the limit as the cause of the fall. B supplies a rival cause of exactly the right size: a third fewer vehicles would produce roughly a third fewer collisions with no change in safety at all.',
      'A and D are about popularity and cost. C is compatible with the road still being safer. E is about other roads.',
    ],
    distractors: [
      ['C', 'True of almost every speed limit, and does not explain the fall away.'],
      ['E', 'Interesting, but it neither explains nor undercuts the Mill Road figure.'],
    ],
    method: 'The strongest weakener usually supplies an alternative cause of about the right magnitude.',
  }),
  fixture({
    id: 'fx-ct-strengthen-01',
    component: 'critical-thinking',
    skill: 'ct-strengthen-weaken',
    blocks: [
      p(
        'A hospital introduced a short safety checklist to be completed before every operation. In the following year, post-operative infections fell by half. The checklist reduced infections.',
      ),
      p('Which of the following, if true, most strengthens the argument?'),
    ],
    options: opts([
      ['A', 'The checklist took surgical teams only two minutes to complete.'],
      ['B', 'Surgeons reported that they found the checklist straightforward to use.'],
      ['C', 'Infection rates at three comparable hospitals that did not introduce a checklist were unchanged over the same year.'],
      ['D', 'The hospital also refurbished its surgical waiting areas during the same year.'],
      ['E', 'Infection rates at the hospital had been declining slowly for the previous decade.'],
    ]),
    answer: 'C',
    why: [
      'The obvious alternative explanation is that infections were falling anyway, everywhere. C rules that out with a comparison group.',
      'D introduces a second change at the same hospital, which weakens the argument. E suggests a pre-existing trend, which also weakens it.',
    ],
    distractors: [
      ['D', 'A confounder — this makes the causal claim harder to sustain, not easier.'],
      ['E', 'A pre-existing downward trend competes with the checklist as the explanation.'],
    ],
    method: 'The strongest strengthener usually removes the best alternative explanation.',
  }),
  fixture({
    id: 'fx-ct-flaw-01',
    component: 'critical-thinking',
    skill: 'ct-flaws',
    blocks: [
      p('Every member of the orchestra can read music. Tom can read music. So Tom is a member of the orchestra.'),
      p('Which of the following best describes the flaw in this argument?'),
    ],
    options: opts([
      ['A', 'It assumes the very thing it sets out to prove.'],
      ['B', 'It treats a condition that all members meet as though only members could meet it.'],
      ['C', 'It draws a general conclusion from an unrepresentative sample.'],
      ['D', 'It mistakes a correlation for a cause.'],
      ['E', 'It attacks the person rather than the argument.'],
    ]),
    answer: 'B',
    why: [
      'The premise gives: orchestra member → reads music. The argument uses it the other way round.',
      'Reading music is presented as necessary for membership and then treated as sufficient for it, which is exactly what B describes.',
    ],
    distractors: [
      ['A', 'Circularity is a different failure — nothing here is assumed in the premises.'],
      ['D', 'There is no causal claim in the argument at all.'],
    ],
    method: 'Write the conditional as an arrow. If the argument runs it backwards, that is the flaw.',
  }),
  fixture({
    id: 'fx-ct-flaw-02',
    component: 'critical-thinking',
    skill: 'ct-flaws',
    blocks: [
      p(
        'Either we cut the library budget or we close the leisure centre. We are certainly not going to close the leisure centre. So the library budget must be cut.',
      ),
      p('Which of the following best describes the flaw in this argument?'),
    ],
    options: opts([
      ['A', 'It presents two options as though they were the only possibilities available.'],
      ['B', 'It reverses a conditional statement.'],
      ['C', 'It generalises from a single case.'],
      ['D', 'It confuses a necessary condition with a sufficient one.'],
      ['E', 'It relies on the authority of the speaker rather than on evidence.'],
    ]),
    answer: 'A',
    why: [
      'Given the first sentence, the reasoning that follows is perfectly valid — the weakness is in that first sentence itself.',
      'Nothing rules out raising income, cutting a third service, or making a smaller cut to both. The argument only works if the menu really has just two items.',
    ],
    distractors: [
      ['B', 'No conditional is reversed here; the step from the premises is sound.'],
      ['D', 'There is no necessary/sufficient confusion in this argument.'],
    ],
    method: 'When an argument offers a choice of two, ask what a third option would be.',
  }),
  fixture({
    id: 'fx-ct-pattern-01',
    component: 'critical-thinking',
    skill: 'ct-argument-patterns',
    blocks: [
      p('If the alarm had been working, the break-in would have been detected. The break-in was not detected. So the alarm was not working.'),
      p('Which of the following arguments is most similar in structure to the argument above?'),
    ],
    options: opts([
      ['A', 'If the seeds were fresh, they would have germinated. They did not germinate. So the seeds were not fresh.'],
      ['B', 'If the seeds were fresh, they would have germinated. The seeds were fresh. So they germinated.'],
      ['C', 'If the seeds germinated, they were fresh. The seeds were not fresh. So they did not germinate.'],
      ['D', 'If the seeds were fresh, they would have germinated. They germinated. So the seeds were fresh.'],
      ['E', 'The seeds did not germinate. Fresh seeds usually germinate. So the seeds were probably not fresh.'],
    ]),
    answer: 'A',
    why: [
      'The original skeleton is: if P then Q; not Q; therefore not P.',
      'A has exactly that shape. B affirms the antecedent, D affirms the consequent, C starts from a different conditional, and E is a probabilistic argument rather than a deductive one.',
    ],
    distractors: [
      ['D', 'The same topic and nearly the same words, but the second step is reversed.'],
      ['E', 'Reaches a similar conclusion by a looser route — "probably" is not the same shape.'],
    ],
    method: 'Replace the content with letters before comparing. Match skeletons, not subjects.',
  }),
  fixture({
    id: 'fx-ct-pattern-02',
    component: 'critical-thinking',
    skill: 'ct-argument-patterns',
    reservedForMock: true,
    blocks: [
      p('All the cafés on the square close at six. The Bluebird closes at nine. So the Bluebird is not on the square.'),
      p('Which of the following arguments is most similar in structure to the argument above?'),
    ],
    options: opts([
      ['A', 'All the shops on the high street sell food. The chemist sells no food. So the chemist is not on the high street.'],
      ['B', 'All the shops on the high street sell food. The chemist is on the high street. So the chemist sells food.'],
      ['C', 'Most shops on the high street sell food. The chemist sells food. So the chemist is probably on the high street.'],
      ['D', 'All the shops on the high street sell food. The chemist sells food. So the chemist is on the high street.'],
      ['E', 'No shop on the high street sells food. The chemist sells food. So the chemist is not on the high street.'],
    ]),
    answer: 'A',
    why: [
      'Skeleton: all A are B; x is not B; therefore x is not A.',
      'A matches exactly. B applies the rule forwards, D runs it backwards, C is probabilistic, and E starts from a negative universal.',
    ],
    method: 'All A are B, and x is not B, always gives you that x is not A.',
  }),
  fixture({
    id: 'fx-ct-principle-01',
    component: 'critical-thinking',
    skill: 'ct-apply-principle',
    blocks: [
      p(
        'A rail operator’s rule states: a passenger may carry a bicycle free of charge if the bicycle folds, or if the journey begins outside peak hours and the passenger has reserved a cycle space. Peak hours run from 07:00 to 09:30.',
      ),
      p('Which passenger is entitled to carry their bicycle free of charge under this rule?'),
    ],
    options: opts([
      ['A', 'Rana, with a non-folding bicycle, beginning her journey at 08:00 with a reserved cycle space.'],
      ['B', 'Sam, with a folding bicycle, beginning his journey at 08:00 with no reservation.'],
      ['C', 'Tom, with a non-folding bicycle, beginning his journey at 11:00 with no reservation.'],
      ['D', 'Uma, with a non-folding bicycle, beginning her journey at 08:00 with no reservation.'],
      ['E', 'Vik, with a non-folding bicycle, beginning his journey at 07:30 with a reserved cycle space.'],
    ]),
    answer: 'B',
    why: [
      'The rule offers two independent routes. The first — a folding bicycle — carries no time or reservation condition at all, and Sam meets it.',
      'A and E fail because their journeys begin inside peak hours, so the second route is closed to them however good their reservation. C has an off-peak journey but no reservation, and the second route needs both.',
    ],
    distractors: [
      ['A', 'Has the reservation but travels in peak hours — the second route needs both conditions.'],
      ['C', 'Travels off-peak but without a reservation — again, both are required.'],
    ],
    method: 'Separate an "or" into two routes, then check every condition on the route you are using.',
  }),
  fixture({
    id: 'fx-ct-principle-02',
    component: 'critical-thinking',
    skill: 'ct-apply-principle',
    blocks: [
      p(
        'A council grant is available to a household whose annual income is below £25,000 and which has lived in the borough for at least two years. Households already receiving the housing allowance are exempt from the income condition.',
      ),
      p('Which household is entitled to the grant?'),
    ],
    options: opts([
      ['A', 'The Aldens: income £31,000, three years in the borough, not receiving the housing allowance.'],
      ['B', 'The Bhattis: income £22,000, eight months in the borough, not receiving the housing allowance.'],
      ['C', 'The Carrs: income £40,000, five years in the borough, receiving the housing allowance.'],
      ['D', 'The Dunns: income £18,000, one year in the borough, receiving the housing allowance.'],
      ['E', 'The Evanses: income £24,000, moved to the borough last month.'],
    ]),
    answer: 'C',
    why: [
      'The exemption removes the income condition only. The residence condition survives it.',
      'The Carrs are exempt from the income test and have lived in the borough for five years, so they qualify. The Dunns are also exempt, but one year is short of the two-year requirement.',
    ],
    distractors: [
      ['D', 'The trap: the exemption is read as excusing both conditions rather than just the income one.'],
      ['A', 'Fails the income condition with no exemption to fall back on.'],
    ],
    method: 'An exemption removes exactly the condition it names, and no others.',
  }),
]
