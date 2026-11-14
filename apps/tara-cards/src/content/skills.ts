import type { Skill } from '@/domain/types'

/**
 * The teaching structure of the app.
 *
 * Critical Thinking and Problem Solving skills follow the question types
 * described in the 2026-27 question guide [S5], under learner-friendly names.
 * The Writing skills are this app's own teaching structure, built around the
 * official task (explain the statement, argue against it, say how far you
 * agree) and UAT-UK's recommendations for it [S5].
 *
 * Nothing here implies official weightings. All teaching text and worked
 * examples are original to this app.
 */
export const SKILLS: Skill[] = [
  /* ---------------- Critical Thinking ---------------- */
  {
    id: 'ct-main-conclusion',
    officialName: 'Identifying the Main Conclusion',
    componentId: 'critical-thinking',
    title: 'Main conclusions',
    summary: 'Find the one thing the passage is trying to get you to accept.',
    method: [
      'Read once for the gist, then ask: if the author could only keep one sentence, which would it be?',
      'Test each candidate with "because": the conclusion is supported by the others, not the other way round.',
      'Watch for conclusion markers (so, therefore, hence, it follows that) and for reason markers (because, since, as, given that).',
      'Beware the first and last sentences: either can be scene-setting rather than the claim.',
      'Reject options that are true, but are a reason rather than the point being argued for.',
    ],
    workedExample: {
      stem: 'Cycle lanes in this city are used far less in winter than in summer. Yet winter is when road conditions are worst and collisions most frequent. The council should therefore spend its winter maintenance budget on the roads the majority actually use.',
      walkthrough: [
        'Candidate A: "cycle lanes are used less in winter" — this is offered as evidence, so it is a reason.',
        'Candidate B: "winter is when collisions are most frequent" — also evidence; it explains why the spending matters.',
        'Candidate C: "the council should spend its winter budget on the roads the majority use" — the two facts are given in support of this, and "therefore" points at it.',
        'C is the main conclusion.',
      ],
      takeaway: 'The conclusion is the claim everything else is working for, not the most interesting fact on the page.',
    },
    commonMistakes: [
      'Choosing a statement that is true and prominent, but is supporting evidence.',
      'Choosing an intermediate conclusion that is itself used to support a later claim.',
      'Choosing a stronger or wider version of the claim than the author actually made.',
    ],
    relatedSkillIds: ['ct-inference', 'ct-assumptions'],
  },
  {
    id: 'ct-inference',
    officialName: 'Drawing a Conclusion',
    componentId: 'critical-thinking',
    title: 'Supported inferences',
    summary: 'Decide what genuinely follows from the passage, and no more.',
    method: [
      'Treat the passage as the only evidence. Outside knowledge is not admissible.',
      'For each option ask: could this be false while everything in the passage stays true? If yes, it does not follow.',
      'Underline quantifiers — some, most, all, only, never — and check the option keeps them.',
      'Prefer the cautious option. A modest claim is easier to support than a sweeping one.',
      'Watch for swapped direction: "most doctors are cautious" does not give you "most cautious people are doctors".',
    ],
    workedExample: {
      stem: 'Every pupil who finished the coursework passed the module. Some pupils who failed the module had started the coursework.',
      walkthrough: [
        '"Some pupils who failed had started the coursework" plus "everyone who finished passed" means those pupils started but did not finish.',
        'So "some pupils started the coursework without finishing it" follows.',
        '"Finishing the coursework is why pupils passed" does not follow — the passage gives a pattern, not a cause.',
        '"Every pupil who passed finished the coursework" does not follow either; that reverses the original conditional.',
      ],
      takeaway: 'Reversing a conditional is the most common way a tempting option goes wrong.',
    },
    commonMistakes: [
      'Importing plausible real-world knowledge the passage never states.',
      'Turning a correlation in the passage into a cause in the answer.',
      'Strengthening "some" into "most", or "most" into "all".',
    ],
    relatedSkillIds: ['ct-main-conclusion', 'ct-assumptions', 'ct-apply-principle'],
  },
  {
    id: 'ct-assumptions',
    officialName: 'Identifying an Assumption',
    componentId: 'critical-thinking',
    title: 'Assumptions',
    summary: 'Name the unstated step the argument needs in order to work.',
    method: [
      'State the conclusion and the stated reasons in your own words.',
      'Look for the gap: something in the conclusion that appeared nowhere in the reasons.',
      'Apply the negation test — deny the candidate assumption. If the argument collapses, it is the assumption.',
      'An assumption must be necessary, not merely helpful. "It would be nice if…" is not enough.',
      'Keep it minimal: the weakest statement that closes the gap is usually the answer.',
    ],
    workedExample: {
      stem: 'The new reading scheme raised test scores at Oakfield School. The council should roll it out across the borough.',
      walkthrough: [
        'Reason: scores rose at Oakfield after the scheme. Conclusion: roll it out everywhere.',
        'Gap: Oakfield appears in the reason; the whole borough appears only in the conclusion.',
        'Candidate assumption: other schools in the borough are enough like Oakfield for the scheme to work there too.',
        'Negate it: other schools are so unlike Oakfield that the scheme would not work. The argument falls apart, so this is a necessary assumption.',
      ],
      takeaway: 'Find the term that appears in the conclusion but never in the reasons — the assumption usually bridges it.',
    },
    commonMistakes: [
      'Picking a statement that would strengthen the argument rather than one it depends on.',
      'Picking something already stated in the passage — that is a reason, not an assumption.',
      'Picking an assumption far stronger than the argument needs.',
    ],
    relatedSkillIds: ['ct-strengthen-weaken', 'ct-flaws', 'ct-main-conclusion'],
  },
  {
    id: 'ct-strengthen-weaken',
    officialName: 'Assessing the Impact of Additional Evidence',
    componentId: 'critical-thinking',
    title: 'Strengthening and weakening',
    summary: 'Judge which extra fact would most help or most damage the reasoning.',
    method: [
      'Fix the conclusion in mind first; a fact only strengthens or weakens relative to it.',
      'Ask what the argument is quietly relying on — that is where new evidence bites hardest.',
      'For weakening: look for an alternative explanation, a counterexample, or evidence the sample was unrepresentative.',
      'For strengthening: look for something that rules out the main alternative explanation.',
      'Check the option actually touches this argument. A true, interesting, irrelevant fact does neither job.',
    ],
    workedExample: {
      stem: 'Sales rose 20% in the month after the shop repainted its front. Repainting the front increases sales.',
      walkthrough: [
        'The argument relies on the repainting being the cause, not something that merely coincided with it.',
        'Strongest weakener: a competing shop on the same street closed that month — an alternative explanation for the rise.',
        'Weak weakener: the paint was more expensive than expected. That is about cost, not about cause.',
        'Strongest strengthener: sales at the chain’s other branches, unchanged and unpainted, stayed flat over the same month.',
      ],
      takeaway: 'The best weakener usually supplies a rival cause; the best strengthener usually removes one.',
    },
    commonMistakes: [
      'Choosing an option that attacks a claim the author never made.',
      'Confusing "makes me feel differently about the topic" with "changes how well the reasons support the conclusion".',
      'Overlooking that a small, precisely aimed fact beats a large, vaguely related one.',
    ],
    relatedSkillIds: ['ct-assumptions', 'ct-flaws'],
  },
  {
    id: 'ct-flaws',
    officialName: 'Detecting Reasoning Errors',
    componentId: 'critical-thinking',
    title: 'Flaws',
    summary: 'Say precisely what has gone wrong in a piece of reasoning.',
    method: [
      'Separate the reasons from the conclusion before judging anything.',
      'Ask: even if every reason were true, would the conclusion follow?',
      'Run through the familiar failures: cause from correlation, unrepresentative sample, circularity, false dilemma, attacking the person, shifting the meaning of a word, confusing necessary with sufficient.',
      'Name the flaw in your own words before reading the options, then match.',
      'Reject options that describe a real weakness of a different argument.',
    ],
    workedExample: {
      stem: 'Anyone serious about the environment recycles. Priya recycles, so Priya is serious about the environment.',
      walkthrough: [
        'The stated rule is: serious → recycles.',
        'The argument uses it as: recycles → serious. That is the converse.',
        'Recycling is presented as necessary for being serious, and then treated as sufficient.',
        'So the flaw is confusing a necessary condition with a sufficient one.',
      ],
      takeaway: 'Write the conditional out as an arrow. Most flaw questions are a reversed or negated arrow.',
    },
    commonMistakes: [
      'Saying "the argument is biased" without identifying the logical step that fails.',
      'Treating an unpopular conclusion as evidence of a flaw.',
      'Picking a real flaw that this particular argument does not commit.',
    ],
    relatedSkillIds: ['ct-assumptions', 'ct-argument-patterns', 'ct-strengthen-weaken'],
  },
  {
    id: 'ct-argument-patterns',
    officialName: 'Matching Arguments',
    componentId: 'critical-thinking',
    title: 'Argument patterns',
    summary: 'Match the shape of one argument to the shape of another, ignoring the subject.',
    method: [
      'Strip the argument to letters: "All A are B; x is an A; so x is a B".',
      'Record the order of the steps and whether each is a general rule, a particular case, or a conclusion.',
      'Note any negations and any conditionals, and keep their direction.',
      'Compare the skeletons, not the topics. A passage about trains can share a shape with one about medicine.',
      'If two options share the shape, check whether one also matches the argument’s validity.',
    ],
    workedExample: {
      stem: 'If the bridge were unsafe, it would be closed. It is open, so it is not unsafe.',
      walkthrough: [
        'Skeleton: If P then Q. Not Q. Therefore not P.',
        'That is a valid pattern (denying the consequent).',
        'A parallel argument: "If she had read the email, she would have replied. She has not replied, so she has not read it."',
        'Not parallel: "If she had read the email, she would have replied. She has read it, so she has replied" — same premise, different second step.',
      ],
      takeaway: 'Letters first, topic second. The shape is the answer.',
    },
    commonMistakes: [
      'Matching on subject matter — two arguments about school funding need not share a shape.',
      'Losing a negation while abstracting.',
      'Matching a valid argument to an invalid one of superficially similar wording.',
    ],
    relatedSkillIds: ['ct-flaws', 'ct-apply-principle'],
  },
  {
    id: 'ct-apply-principle',
    officialName: 'Applying Principles',
    componentId: 'critical-thinking',
    title: 'Applying a rule or principle',
    summary: 'Take a stated rule and work out what it does and does not settle.',
    method: [
      'Write the rule as a conditional: when X holds, Y follows.',
      'List the conditions the rule actually requires. Do not add any.',
      'Check each case against every condition in turn, not just the most obvious one.',
      'Distinguish cases the rule forbids, cases it requires, and cases it simply says nothing about.',
      'When two rules apply, check whether either states a priority.',
    ],
    workedExample: {
      stem: 'Rule: a resident may park free on the high street if they hold a permit and arrive before 10am. Ben holds a permit and arrives at 9:30am; Cara has no permit and arrives at 8am.',
      walkthrough: [
        'The rule needs two conditions together: permit AND before 10am.',
        'Ben meets both, so the rule grants him free parking.',
        'Cara fails the permit condition, so the rule does not grant it.',
        'But the rule does not say she must pay either — it is silent on non-permit holders. Only claim what the rule settles.',
      ],
      takeaway: 'Rules have edges. "Not granted by the rule" is not the same as "forbidden by the rule".',
    },
    commonMistakes: [
      'Treating a rule that grants something as if it also forbids everything else.',
      'Dropping one of several conditions joined by "and".',
      'Filling silence in the rule with what feels fair.',
    ],
    relatedSkillIds: ['ct-inference', 'ct-argument-patterns'],
  },

  /* ---------------- Problem Solving ---------------- */
  {
    id: 'ps-relevant-selection',
    officialName: 'Relevant Selection',
    componentId: 'problem-solving',
    title: 'Selecting relevant information',
    summary: 'Pull the few figures that matter out of a crowded table, chart or paragraph.',
    method: [
      'Read the question before the data, and write down exactly what is being asked for, with its units.',
      'Identify the one row, column or sentence that answers it, and mark the rest as scenery.',
      'Check the small print: totals that exclude a category, footnotes, "per 1,000", dates that do not match.',
      'Estimate the answer roughly before calculating, so an absurd result is obvious.',
      'Re-read the question at the end. The most common error is answering a neighbouring question.',
    ],
    workedExample: {
      stem: 'A table lists five bus routes with journey time, fare, and passengers per day. Which route earns the most fare revenue per day?',
      walkthrough: [
        'The question asks about revenue, so journey time is scenery.',
        'Revenue per day = fare x passengers per day, so only those two columns matter.',
        'Estimate first: a route with a high fare and middling numbers may beat a cheap, busy one.',
        'Compute only the two or three plausible candidates rather than all five.',
      ],
      takeaway: 'Deciding what to ignore is most of the work, and it is quicker than arithmetic.',
    },
    commonMistakes: [
      'Calculating with every column because it is there.',
      'Missing a units change between the table and the question.',
      'Answering "which is largest" when the question asked "which is largest per passenger".',
    ],
    relatedSkillIds: ['ps-finding-method', 'ps-equivalence'],
  },
  {
    id: 'ps-finding-method',
    officialName: 'Finding Procedures',
    componentId: 'problem-solving',
    title: 'Finding a method',
    summary: 'Choose a route to the answer, especially when no formula is offered.',
    method: [
      'Say what you want and what you have, then look for the bridge between them.',
      'Try the cheap methods first: work backwards from the options, try a small case, or test a round number.',
      'For "how many ways" questions, enumerate systematically — fix one thing, vary the rest, and never re-count.',
      'For rate, ratio and mixture questions, convert everything to one unit before combining.',
      'If a method is taking more than about two minutes, abandon it and try elimination instead.',
    ],
    workedExample: {
      stem: 'A tap fills a tank in 12 minutes; a drain empties it in 18. Both open, how long to fill?',
      walkthrough: [
        'Convert to rates per minute: the tap adds 1/12 of a tank, the drain removes 1/18.',
        'Net rate = 1/12 - 1/18. Use 36 as a common denominator: 3/36 - 2/36 = 1/36.',
        'At 1/36 of a tank per minute, a full tank takes 36 minutes.',
        'Sanity check: the drain is slower than the tap, so filling should take longer than 12 minutes. It does.',
      ],
      takeaway: 'Rates add; times do not. Convert to "amount per minute" and the problem becomes arithmetic.',
    },
    commonMistakes: [
      'Averaging two times instead of combining two rates.',
      'Committing to algebra when checking the five options would be faster.',
      'Enumerating by hand without a system, and double-counting.',
    ],
    relatedSkillIds: ['ps-relevant-selection', 'ps-equivalence'],
  },
  {
    id: 'ps-equivalence',
    officialName: 'Identifying Similarity',
    componentId: 'problem-solving',
    title: 'Recognising equivalent patterns and representations',
    summary: 'See when a table, a graph, a formula and a description are all saying the same thing.',
    method: [
      'Translate every representation into one shared form — usually a short table of matching values.',
      'Test with anchor points: what happens at zero, at the maximum, at the crossing point?',
      'For graphs, read the axes and their units before the shape; check whether a scale is cumulative or per period.',
      'For percentages, fix the base: a 20% rise then a 20% fall does not return to the start.',
      'For shapes and nets, track one labelled feature — a corner, a face, a shaded square — through the transformation.',
    ],
    workedExample: {
      stem: 'A chart shows cumulative rainfall over six months; a table shows monthly rainfall. Do they agree?',
      walkthrough: [
        'Cumulative means each point includes everything before it, so it can never go down.',
        'Take differences between consecutive chart readings to recover monthly values.',
        'Compare those differences with the table, month by month.',
        'A flat stretch in the cumulative chart must appear as a zero in the table, not as a fall.',
      ],
      takeaway: 'Convert everything into one representation before comparing. Differences turn cumulative into per-period.',
    },
    commonMistakes: [
      'Reading a cumulative graph as if it showed per-period values.',
      'Comparing percentages that have different bases.',
      'Assuming a net folds the way it looks on the page without tracking a single face.',
    ],
    relatedSkillIds: ['ps-relevant-selection', 'ps-finding-method'],
  },

  /* ---------------- Writing ---------------- */
  {
    id: 'wr-interpret-claim',
    componentId: 'writing',
    title: 'Interpreting the claim',
    summary: 'Work out exactly what the prompt is asserting before you agree or disagree with it.',
    method: [
      'Paraphrase the claim in one sentence, without the rhetoric.',
      'Identify its scope: always or sometimes, everyone or some people, in general or in a named case.',
      'Ask what would have to be true for it to hold, and what would show it false.',
      'Note which part of it is genuinely contestable — that is where your essay should live.',
      'Answer the prompt in front of you, not the one you revised for.',
    ],
    workedExample: {
      stem: '"A society is judged by how it treats its weakest members."',
      walkthrough: [
        'Paraphrase: the moral standing of a society depends chiefly on its treatment of the vulnerable.',
        'Scope: "judged" could mean "ought to be judged" or "is in fact judged" — these need separating.',
        'Contestable part: whether this single measure is sufficient, or merely one measure among several.',
        'A good essay picks the reading it will defend and says so in the first paragraph.',
      ],
      takeaway: 'An ambiguous prompt is an invitation. Choose a reading explicitly rather than drifting between two.',
    },
    commonMistakes: [
      'Writing about the topic rather than answering the claim.',
      'Silently switching between two readings of the claim halfway through.',
      'Spending the whole essay on what the words might mean and never taking a position.',
    ],
    relatedSkillIds: ['wr-define-terms', 'wr-judgement'],
  },
  {
    id: 'wr-define-terms',
    componentId: 'writing',
    title: 'Defining terms',
    summary: 'Pin down the one or two words the whole argument turns on.',
    method: [
      'Pick the terms that actually do work in the claim, not every abstract noun in it.',
      'Give a usable definition — one that lets a reader decide whether a case falls inside it.',
      'Say what your definition excludes; that boundary is often the most interesting sentence in the essay.',
      'Keep your definition stable, and flag it if you deliberately widen it later.',
      'Do not spend more than two or three sentences on it; definition is groundwork, not the essay.',
    ],
    workedExample: {
      stem: '"Censorship is never justified in a free society."',
      walkthrough: [
        '"Censorship" is doing the work: does it cover a court injunction, a broadcasting watchdog, a private platform’s rules?',
        'Offer a definition: state suppression of expression on the basis of its content.',
        'That excludes a newspaper declining a piece, which matters — many apparent counterexamples fall outside it.',
        'Now the claim becomes testable rather than a slogan.',
      ],
      takeaway: 'A definition earns its place only if it changes which examples count.',
    },
    commonMistakes: [
      'Quoting a dictionary definition that does no argumentative work.',
      'Defining a term so narrowly that the claim becomes trivially true.',
      'Letting a term shift meaning between paragraphs.',
    ],
    relatedSkillIds: ['wr-interpret-claim', 'wr-counterargument'],
  },
  {
    id: 'wr-counterargument',
    componentId: 'writing',
    title: 'Building a counterargument',
    summary: 'State the strongest case against your position, in its own best words.',
    method: [
      'Ask what a thoughtful person who disagrees would actually say, not what an unreasonable one would.',
      'Put the objection in a single clear sentence before responding to it.',
      'Give it its best supporting reason or example — a weak version convinces nobody you have answered it.',
      'Respond in one of three ways: show it is false, show it is true but does not reach your conclusion, or concede it and narrow your claim.',
      'If the objection genuinely wins, say so and adjust your position. That reads as judgement, not weakness.',
    ],
    workedExample: {
      stem: 'Your position: universities should weigh contextual data in admissions.',
      walkthrough: [
        'Strongest objection: it can admit a less-prepared candidate over a better-prepared one, which is unfair to the individual displaced.',
        'Give it force: admissions are a fixed-sum competition, so every contextual offer does displace someone.',
        'Response by narrowing: contextual data should adjust the interpretation of achievement, not substitute for a threshold of preparedness.',
        'That concedes something real while keeping the position intact.',
      ],
      takeaway: 'Steelman first, answer second. An objection you had to work at is worth more than three you dismissed.',
    },
    commonMistakes: [
      'Raising a weak objection purely to knock it down.',
      'Stating an objection and then never actually answering it.',
      'Treating "some people disagree" as a counterargument.',
    ],
    relatedSkillIds: ['wr-weighing', 'wr-judgement', 'wr-examples'],
  },
  {
    id: 'wr-examples',
    componentId: 'writing',
    title: 'Supporting points with examples',
    summary: 'Use an example to do argumentative work, not to decorate a paragraph.',
    method: [
      'State the point first; the example illustrates a claim, it does not replace one.',
      'Choose an example that you can describe accurately in two sentences.',
      'Spell out the link: say what the example shows and why that supports the point.',
      'Prefer one developed example to three name-dropped ones.',
      'If you are unsure of a detail, keep the example general rather than inventing a figure or a date.',
    ],
    workedExample: {
      stem: 'Point: public health measures often work by changing defaults rather than persuading people.',
      walkthrough: [
        'Weak version: "Organ donation is an example of this." — no work done.',
        'Better: describe the mechanism — moving from opt-in to opt-out changes which choice requires effort.',
        'Then state the link: registration rates rise without anyone being persuaded of anything, which is the point.',
        'Two sentences of example, one of linkage.',
      ],
      takeaway: 'An unexplained example is an assertion. The sentence after the example is the one that argues.',
    },
    commonMistakes: [
      'Listing examples without explaining what any of them shows.',
      'Inventing statistics or misattributing a case to sound authoritative.',
      'Choosing an example that also supports the opposing view.',
    ],
    relatedSkillIds: ['wr-counterargument', 'wr-weighing'],
  },
  {
    id: 'wr-weighing',
    componentId: 'writing',
    title: 'Weighing competing arguments',
    summary: 'Compare the two sides on a stated basis instead of listing them side by side.',
    method: [
      'Name the basis of comparison: which consideration matters more here, and why?',
      'Ask which argument survives the other’s best objection.',
      'Distinguish how likely a consequence is from how serious it would be, and say which is driving your view.',
      'Look for a case where the two sides genuinely diverge — that tests them better than a case where both agree.',
      'Avoid the false balance of "there are good points on both sides" with no verdict.',
    ],
    workedExample: {
      stem: 'Should cities ban private cars from the centre?',
      walkthrough: [
        'Side A: air quality and safety improve. Side B: access for disabled residents and deliveries worsens.',
        'Basis for comparison: whose costs are avoidable? Air quality harms fall on everyone; access harms fall on a group that can be exempted.',
        'That basis favours a ban with exemptions over both a blanket ban and no ban.',
        'The verdict follows from the stated basis, so a reader can disagree with the basis rather than guess at your reasoning.',
      ],
      takeaway: 'Weighing means naming the scales. Without a stated basis, a comparison is just two lists.',
    },
    commonMistakes: [
      'Alternating paragraphs for and against and calling that balance.',
      'Concluding "it depends" without saying what it depends on.',
      'Comparing a strong version of your own side with a weak version of the other.',
    ],
    relatedSkillIds: ['wr-counterargument', 'wr-judgement'],
  },
  {
    id: 'wr-judgement',
    componentId: 'writing',
    title: 'Reaching a justified judgement',
    summary: 'End with a position that follows from what you actually argued.',
    method: [
      'State the position plainly; a qualified position is fine, a hidden one is not.',
      'Make the qualification substantive: say under what conditions your view would change.',
      'Check the conclusion against the body — do not conclude something the paragraphs did not support.',
      'Do not introduce a new argument in the final paragraph.',
      'Leave the reader knowing what you think and why, in that order.',
    ],
    workedExample: {
      stem: 'After arguing that contextual admissions are justified but limited:',
      walkthrough: [
        'Weak ending: "So there are arguments on both sides and it is a complex issue."',
        'Better: "Contextual data is justified where it improves the reading of a candidate’s achievement, and unjustified where it substitutes for a threshold of preparedness."',
        'That names the condition that separates the two cases.',
        'It is also checkable against the body: both halves were argued for earlier.',
      ],
      takeaway: 'A good conclusion is a sentence someone could quote back at you and you would still defend.',
    },
    commonMistakes: [
      'Sitting on the fence to avoid being wrong.',
      'Concluding more strongly than the argument supports.',
      'Introducing a fresh consideration in the last two lines.',
    ],
    relatedSkillIds: ['wr-weighing', 'wr-interpret-claim'],
  },
  {
    id: 'wr-planning-editing',
    componentId: 'writing',
    title: 'Planning and editing',
    summary: 'Spend a few minutes deciding the shape, then protect a few minutes to fix it.',
    method: [
      'Plan for 5 to 10 minutes before writing — UAT-UK\u2019s own recommendation — grouping your ideas around the three parts of the task.',
      'Decide your order before writing; reordering paragraphs later costs far more than planning did.',
      'Write to the word limit deliberately — a 750-word limit rewards a plan that has three points, not six.',
      'Reserve the last few minutes for editing: cut throat-clearing openings, fix the linking sentences, check the conclusion matches the body.',
      'Read the first sentence of each paragraph in sequence; together they should read as a coherent argument.',
    ],
    workedExample: {
      stem: 'A five-line plan for "Censorship is never justified in a free society."',
      walkthrough: [
        'Position: rarely justified, but "never" is too strong.',
        'Move 1: define censorship as state content-based suppression.',
        'Move 2: the strongest case for "never" — the state is a poor judge of which content is harmful.',
        'Move 3: the exception that survives it — direct incitement, where the harm is immediate and the judgement is narrow.',
        'Verdict: "almost never, and only where the harm is immediate and the judgement narrow".',
      ],
      takeaway: 'The plan is where the essay is won. Writing is transcription of a decision already made.',
    },
    commonMistakes: [
      'Starting to write before knowing the verdict, then discovering it in paragraph four.',
      'Planning six points and running out of words after three.',
      'Leaving no time to read the essay back.',
    ],
    relatedSkillIds: ['wr-interpret-claim', 'wr-judgement'],
  },
]

export const SKILL_BY_ID = new Map(SKILLS.map((s) => [s.id, s]))

export const SKILL_IDS = SKILLS.map((s) => s.id)

export const skillsForComponent = (componentId: string) =>
  SKILLS.filter((s) => s.componentId === componentId)

/**
 * Secondary technique tags for Problem Solving. These are practice filters
 * chosen by this app for convenience. They are not official question
 * categories, and the mathematical scope should be checked against the
 * content specification [S4] during content review.
 */
export const PS_TECHNIQUE_TAGS = [
  'percentages',
  'fractions',
  'ratios',
  'arithmetic',
  'averages',
  'money',
  'time',
  'unit conversion',
  'tables',
  'graphs',
  'spatial reasoning',
  'area',
  'perimeter',
  'volume',
  'systematic enumeration',
  'working backwards',
] as const

export type PsTechniqueTag = (typeof PS_TECHNIQUE_TAGS)[number]
