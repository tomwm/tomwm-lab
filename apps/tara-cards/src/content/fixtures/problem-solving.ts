import type { ContentBlock, Question } from '@/domain/types'
import { fixture, opts, p } from './builder'

const vanTable: ContentBlock = {
  kind: 'table',
  caption: 'Monday delivery round, by van',
  headers: ['Van', 'Fuel cost per mile', 'Miles driven', 'Parcels delivered', 'Driver hours'],
  rows: [
    ['A', '14p', '120', '60', '8'],
    ['B', '11p', '150', '55', '9'],
    ['C', '18p', '80', '72', '7'],
    ['D', '12p', '200', '80', '10'],
    ['E', '16p', '90', '45', '6'],
  ],
}

/** A small, readable line chart. Its alt text gives the readings, not the answer. */
const rainfallFigure: ContentBlock = {
  kind: 'figure',
  alt: 'A line chart of cumulative rainfall in millimetres from January to May. The line passes through 20 at January, 55 at February, 75 at March, 140 at April and 160 at May.',
  caption: 'Cumulative rainfall, January to May',
  svg: `<svg viewBox="0 0 320 200" role="img" xmlns="http://www.w3.org/2000/svg">
  <g stroke="currentColor" stroke-opacity="0.25" stroke-width="1">
    <line x1="40" y1="170" x2="300" y2="170" />
    <line x1="40" y1="20" x2="40" y2="170" />
  </g>
  <g font-size="10" fill="currentColor" fill-opacity="0.7" text-anchor="end">
    <text x="34" y="173">0</text>
    <text x="34" y="136">50</text>
    <text x="34" y="98">100</text>
    <text x="34" y="61">150</text>
    <text x="34" y="24">200</text>
  </g>
  <g font-size="10" fill="currentColor" fill-opacity="0.7" text-anchor="middle">
    <text x="70" y="186">Jan</text>
    <text x="122" y="186">Feb</text>
    <text x="174" y="186">Mar</text>
    <text x="226" y="186">Apr</text>
    <text x="278" y="186">May</text>
  </g>
  <polyline fill="none" stroke="currentColor" stroke-width="2"
    points="70,155 122,129 174,114 226,065 278,050" />
  <g fill="currentColor">
    <circle cx="70" cy="155" r="3" /><circle cx="122" cy="129" r="3" />
    <circle cx="174" cy="114" r="3" /><circle cx="226" cy="65" r="3" />
    <circle cx="278" cy="50" r="3" />
  </g>
</svg>`,
}

const carParkTable: ContentBlock = {
  kind: 'table',
  caption: 'Car park charges',
  headers: ['Hours parked', 'Charge'],
  rows: [
    ['1', '£2.00'],
    ['2', '£3.50'],
    ['3', '£5.00'],
    ['4', '£6.50'],
  ],
}

/**
 * Development fixtures — Problem Solving.
 * Original content written for this app. Not official questions.
 */
export const PS_FIXTURES: Question[] = [
  fixture({
    id: 'fx-ps-select-01',
    component: 'problem-solving',
    skill: 'ps-relevant-selection',
    tags: ['tables', 'money', 'arithmetic'],
    blocks: [vanTable, p('Which van had the lowest fuel cost per parcel delivered on Monday?')],
    options: opts([
      ['A', 'Van A'],
      ['B', 'Van B'],
      ['C', 'Van C'],
      ['D', 'Van D'],
      ['E', 'Van E'],
    ]),
    answer: 'C',
    why: [
      'Fuel cost per parcel = (cost per mile × miles) ÷ parcels. The driver-hours column plays no part.',
      'Van C: 18p × 80 = £14.40, over 72 parcels, which is 20p a parcel.',
      'The others come out at 28p (A), 30p (B), 30p (D) and 32p (E), so Van C is lowest.',
    ],
    distractors: [
      ['B', 'The cheapest fuel per mile, which is not the same as the cheapest fuel per parcel.'],
      ['D', 'The most parcels delivered, but also by far the most miles driven.'],
    ],
    method: 'Decide which columns the question actually needs before doing any arithmetic.',
  }),
  fixture({
    id: 'fx-ps-select-02',
    component: 'problem-solving',
    skill: 'ps-relevant-selection',
    tags: ['percentages', 'arithmetic'],
    blocks: [
      p(
        'A cinema has 340 seats. On Friday it ran four screenings. The first was 60% full. The second sold out. The third had 118 empty seats. The fourth was half full. Tickets cost £9.50 for adults and £6.00 for under-16s.',
      ),
      p('How many seats were occupied across the four screenings in total?'),
    ],
    options: opts([
      ['A', '870'],
      ['B', '916'],
      ['C', '936'],
      ['D', '1,020'],
      ['E', '1,122'],
    ]),
    answer: 'C',
    why: [
      'First: 60% of 340 = 204. Second: 340. Third: 340 − 118 = 222. Fourth: 170.',
      '204 + 340 + 222 + 170 = 936. The ticket prices are there to be ignored.',
    ],
    distractors: [
      ['D', 'What you get by treating the third screening’s 118 as the number occupied rather than empty — then rounding.'],
    ],
    method: 'Convert every description into the same unit — here, seats occupied — before adding.',
  }),
  fixture({
    id: 'fx-ps-select-03',
    component: 'problem-solving',
    skill: 'ps-relevant-selection',
    tags: ['percentages', 'averages', 'money'],
    reservedForMock: true,
    blocks: [
      p(
        'A charity’s annual report states that donations rose from £180,000 to £216,000, that the number of donors fell from 1,200 to 900, that administration cost £24,000, and that the charity employs six members of staff.',
      ),
      p('By what percentage did the average donation per donor rise?'),
    ],
    options: opts([
      ['A', '20%'],
      ['B', '33%'],
      ['C', '50%'],
      ['D', '60%'],
      ['E', '90%'],
    ]),
    answer: 'D',
    why: [
      'Average before: £180,000 ÷ 1,200 = £150. Average after: £216,000 ÷ 900 = £240.',
      'The rise is £90 on £150, which is 60%. Administration costs and staff numbers are not needed.',
    ],
    distractors: [
      ['A', 'The percentage rise in total donations, not in the average per donor.'],
    ],
    method: 'A "per" question needs both numbers to move — check whether the denominator changed too.',
  }),
  fixture({
    id: 'fx-ps-method-01',
    component: 'problem-solving',
    skill: 'ps-finding-method',
    tags: ['time', 'fractions', 'working backwards'],
    blocks: [
      p(
        'Printer A can complete a print run on its own in 40 minutes. Printer B can complete the same run on its own in 60 minutes. Both start together, but after 15 minutes Printer B jams and stops. Printer A finishes the run alone.',
      ),
      p('How long does the whole run take?'),
    ],
    options: opts([
      ['A', '24 minutes'],
      ['B', '27.5 minutes'],
      ['C', '30 minutes'],
      ['D', '32 minutes'],
      ['E', '35 minutes'],
    ]),
    answer: 'C',
    why: [
      'Work in rates. A does 1/40 of the run per minute and B does 1/60, so together they do 1/24.',
      'In 15 minutes they complete 15/24 = 5/8 of the run, leaving 3/8.',
      'Printer A alone needs 3/8 × 40 = 15 more minutes, so the run takes 30 minutes in total.',
    ],
    distractors: [
      ['A', 'The time the two printers would take together if B never jammed.'],
      ['E', 'What you get by adding 15 minutes of joint work to 20 minutes of half the job.'],
    ],
    method: 'Rates add; times do not. Convert to "fraction of the job per minute" first.',
  }),
  fixture({
    id: 'fx-ps-method-02',
    component: 'problem-solving',
    skill: 'ps-finding-method',
    tags: ['percentages', 'money'],
    duplicateGroupId: 'grp-markup-discount',
    blocks: [
      p('A shop marks up its goods by 40% on the price it paid for them. In a sale it then takes 25% off the marked price.'),
      p('What is the shop’s percentage profit on cost for goods sold in the sale?'),
    ],
    options: opts([
      ['A', '0%'],
      ['B', '5%'],
      ['C', '10%'],
      ['D', '15%'],
      ['E', '4.7%'],
    ]),
    answer: 'B',
    why: [
      'Take the cost as 100. The marked price is 140. Taking 25% off gives 105.',
      'That is a profit of 5 on a cost of 100, so 5%.',
    ],
    distractors: [
      ['D', 'What you get by subtracting the percentages — 40% − 25% — instead of applying them in turn.'],
    ],
    method: 'Set the starting value to 100 and apply each percentage change in order.',
  }),
  fixture({
    id: 'fx-ps-method-02-variant',
    component: 'problem-solving',
    skill: 'ps-finding-method',
    tags: ['percentages', 'money'],
    // Same underlying question in different clothes. Confirmed by hand, so the
    // two share a duplicate group: meeting one means neither is fresh again.
    duplicateGroupId: 'grp-markup-discount',
    blocks: [
      p('A wholesaler adds 40% to the cost of each item to set its list price, then offers a 25% discount off the list price to trade buyers.'),
      p('What percentage profit on cost does the wholesaler make on a trade sale?'),
    ],
    options: opts([
      ['A', '15%'],
      ['B', '10%'],
      ['C', '5%'],
      ['D', '0%'],
      ['E', '4.7%'],
    ]),
    answer: 'C',
    why: [
      'Cost 100 → list 140 → trade price 105. The profit is 5 on 100, so 5%.',
      'This is the same question as the shop mark-up item, reworded. Answering one does not give you fresh evidence on the other.',
    ],
    method: 'Set the starting value to 100 and apply each percentage change in order.',
  }),
  fixture({
    id: 'fx-ps-method-03',
    component: 'problem-solving',
    skill: 'ps-finding-method',
    tags: ['systematic enumeration', 'arithmetic'],
    blocks: [
      p('A three-digit number has three different digits which add up to 6. Its first digit cannot be zero.'),
      p('How many such numbers are there?'),
    ],
    options: opts([
      ['A', '10'],
      ['B', '12'],
      ['C', '14'],
      ['D', '15'],
      ['E', '18'],
    ]),
    answer: 'C',
    why: [
      'First find the sets of three different digits summing to 6: {0,1,5}, {0,2,4} and {1,2,3}. Nothing else works.',
      '{1,2,3} has no zero, so all 6 orderings are valid.',
      '{0,1,5} and {0,2,4} each have 6 orderings, but the 2 with zero in front are not three-digit numbers, leaving 4 each.',
      '6 + 4 + 4 = 14.',
    ],
    distractors: [
      ['E', 'All 18 orderings, counting the ones that start with zero.'],
    ],
    method: 'Fix the set of digits first, then count arrangements, then subtract the invalid ones.',
  }),
  fixture({
    id: 'fx-ps-equiv-01',
    component: 'problem-solving',
    skill: 'ps-equivalence',
    tags: ['percentages'],
    blocks: [
      p('A jacket’s price rises by 25% in March, then falls by 20% in April.'),
      p('Compared with its February price, the April price is:'),
    ],
    options: opts([
      ['A', 'unchanged'],
      ['B', '5% higher'],
      ['C', '5% lower'],
      ['D', '1% higher'],
      ['E', '4% lower'],
    ]),
    answer: 'A',
    why: [
      'Start at 100. A 25% rise gives 125. A 20% fall from 125 removes 25, giving 100.',
      'The two percentages have different bases, which is exactly why they cancel here.',
    ],
    distractors: [
      ['B', 'The result of adding and subtracting the percentages as if they shared a base.'],
    ],
    method: 'Percentage changes compound; always ask "percent of what?" before combining them.',
  }),
  fixture({
    id: 'fx-ps-equiv-02',
    component: 'problem-solving',
    skill: 'ps-equivalence',
    tags: ['graphs', 'tables'],
    blocks: [
      rainfallFigure,
      p('The chart shows cumulative rainfall from January to May. In which month was rainfall highest?'),
    ],
    options: opts([
      ['A', 'January'],
      ['B', 'February'],
      ['C', 'March'],
      ['D', 'April'],
      ['E', 'May'],
    ]),
    answer: 'D',
    why: [
      'A cumulative chart shows running totals, so each month’s rainfall is the step up from the previous point.',
      'The steps are 20, 35, 20, 65 and 20 millimetres. April’s step of 65 is the largest.',
    ],
    distractors: [
      ['E', 'May sits highest on the chart, but that is the total for the whole period, not May’s own rainfall.'],
    ],
    method: 'To read a cumulative chart per period, take the differences between consecutive points.',
  }),
  fixture({
    id: 'fx-ps-equiv-03',
    component: 'problem-solving',
    skill: 'ps-equivalence',
    tags: ['tables', 'money'],
    blocks: [
      carParkTable,
      p('Which formula gives the charge £C for h hours parked, for whole numbers of hours from 1 to 4?'),
    ],
    options: opts([
      ['A', 'C = 0.50 + 1.50h'],
      ['B', 'C = 2.00h'],
      ['C', 'C = 1.50 + 0.50h'],
      ['D', 'C = 2.00 + 1.50h'],
      ['E', 'C = 1.75h + 0.25'],
    ]),
    answer: 'A',
    why: [
      'Each extra hour adds £1.50, so the coefficient of h is 1.50.',
      'At h = 1 the charge is £2.00, so the constant is 2.00 − 1.50 = 0.50. Check h = 4: 0.50 + 6.00 = £6.50. Correct.',
    ],
    distractors: [
      ['D', 'Uses the first hour’s charge as the constant, which double-counts that hour.'],
      ['B', 'Fits h = 1 only.'],
    ],
    method: 'For a table with a constant step, the step is the gradient and the constant follows from any one row.',
  }),

  /* --- Fixtures that exist to exercise the app's honesty paths --- */
  fixture({
    id: 'fx-ps-no-explanation-01',
    component: 'problem-solving',
    skill: 'ps-relevant-selection',
    tags: ['unit conversion', 'arithmetic'],
    // Demonstrates the "key but no explanation" path: markable, but the back
    // must say so rather than inventing a worked solution.
    explanationStatus: 'none',
    blocks: [
      p('A tank holds 4.5 cubic metres of water. A pump removes 250 litres every minute.'),
      p('How long does the pump take to empty the tank?'),
    ],
    options: opts([
      ['A', '15 minutes'],
      ['B', '18 minutes'],
      ['C', '20 minutes'],
      ['D', '22.5 minutes'],
      ['E', '25 minutes'],
    ]),
    answer: 'B',
    why: [],
    method: undefined,
  }),
  fixture({
    id: 'fx-ps-quarantined-01',
    component: 'problem-solving',
    skill: 'ps-equivalence',
    tags: ['spatial reasoning'],
    // Demonstrates quarantine: the diagram this question depends on is missing,
    // so it can never enter scored practice.
    availability: 'quarantined',
    quarantineReason: 'Figure referenced but no asset present; assets not checked.',
    flags: { assetsChecked: false },
    blocks: [
      { kind: 'figure', alt: 'A net of a cube with one face shaded and an arrow marked on an adjacent face.' },
      p('When the net is folded into a cube, which face is opposite the shaded one?'),
    ],
    options: opts([
      ['A', 'The face marked with the arrow'],
      ['B', 'The face to the left of the arrow'],
      ['C', 'The blank face at the end of the row'],
      ['D', 'The face below the shaded one'],
      ['E', 'Cannot be determined from the net'],
    ]),
    answer: null,
    answerVerification: 'none',
    why: [],
    explanationStatus: 'none',
  }),
]
