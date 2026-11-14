/**
 * Domain records for TARA Cards.
 *
 * Cards are *views* over these records — there is deliberately no recursive
 * generic `Card` object. A component card renders a Component, a skill card
 * renders a Skill, a question card renders a Question plus the learner's
 * Attempt history for it.
 */

export type ComponentId = 'critical-thinking' | 'problem-solving' | 'writing'

export interface StudyComponent {
  id: ComponentId
  name: string
  order: number
  description: string
  /** Design token prefix for this component's restrained accent: ct | ps | wr */
  accent: 'ct' | 'ps' | 'wr'
}

export interface WorkedExample {
  /** Original, app-authored miniature example. Never an official question. */
  stem: string
  walkthrough: string[]
  takeaway: string
}

export interface Skill {
  id: string
  componentId: ComponentId
  title: string
  /** The question type as UAT-UK's question guide names it, where there is one. [S5] */
  officialName?: string
  /** One sentence, shown on the skill card. */
  summary: string
  /** Numbered method the learner can actually apply under time pressure. */
  method: string[]
  workedExample: WorkedExample
  commonMistakes: string[]
  relatedSkillIds: string[]
}

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

/**
 * How a source's content may be used in this app.
 * `unknown` defaults to link-only: public reachability is not a licence.
 */
export type ContentUseStatus = 'link-only' | 'interactive-approved' | 'unknown'

export type ImportStatus = 'not-imported' | 'partially-imported' | 'imported'

export interface Source {
  id: string
  /** e.g. "BMAT", "TSA", "TARA", "UAT-UK" */
  exam: string
  /** Year or year range as printed by the provider; null for undated hubs. */
  year: string | null
  section: string | null
  title: string
  /** Where the learner can actually open this material. */
  paperUrl: string
  /** Answer key location, when the provider publishes one separately. */
  keyUrl: string | null
  /** ISO date this URL was last confirmed by a human or by the fetch script. */
  retrievedAt: string
  /** Version marker or content hash, when one is available. */
  version: string | null
  attribution: string
  contentUse: ContentUseStatus
  importStatus: ImportStatus
  /** Honest free-text note: what is and is not available locally. */
  note: string
}

/* ------------------------------------------------------------------ */
/* Questions                                                           */
/* ------------------------------------------------------------------ */

export type ContentBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'passage'; text: string; label?: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | {
      kind: 'table'
      caption: string
      headers: string[]
      rows: string[][]
    }
  | {
      kind: 'figure'
      /** Alt text must describe the given information without revealing the answer. */
      alt: string
      /** Inline SVG markup, kept in content so there are no missing binary assets. */
      svg?: string
      /**
       * Reference into the pack's `assets` map, for an image shared by several
       * questions (a passage that questions 8–11 all refer to). Resolved to
       * `svg` when the pack is loaded.
       */
      assetId?: string
      caption?: string
    }

export interface QuestionOption {
  /** Stable across re-renders and re-imports; marking references this, not an index. */
  id: string
  label: string
  blocks: ContentBlock[]
}

export type AnswerVerification = 'verified-key' | 'unverified' | 'none'

export type ExplanationStatus =
  | 'none'
  | 'official'
  | 'app-authored-reviewed'
  | 'app-authored-draft'

export interface Explanation {
  status: ExplanationStatus
  blocks: ContentBlock[]
  /** Why each tempting wrong option attracts people, where reviewed. */
  distractors: { optionId: string; note: string }[]
  /** Short transferable method, in the learner's own future words. */
  method: string | null
  sourceNote: string | null
}

export interface ReviewFlags {
  transcriptionChecked: boolean
  answerKeyChecked: boolean
  alignmentChecked: boolean
  assetsChecked: boolean
}

/** Whether an item may be rendered in-app or only linked out to. */
export type DistributionMode = 'link-only' | 'interactive-approved'

/** Practical availability, derived at import and stored explicitly. */
export type Availability = 'interactive' | 'link-only' | 'quarantined'

export type Provenance = 'official' | 'app-fixture'

export interface SourceLocator {
  sourceId: string
  paper: string | null
  questionNumber: number | null
  page: number | null
  keyLocator: string | null
}

export interface Question {
  id: string
  /** Bumped when content changes; attempts pin the version they saw. */
  version: number
  componentId: Exclude<ComponentId, 'writing'>
  /** Exactly one, so component and skill reports never double-count. */
  primarySkillId: string
  /** Any number, for discovery and filtering only. */
  secondaryTags: string[]
  locator: SourceLocator
  blocks: ContentBlock[]
  options: QuestionOption[]
  /** Null when no verified key has been imported. Never guessed. */
  answerOptionId: string | null
  answerVerification: AnswerVerification
  explanation: Explanation
  flags: ReviewFlags
  availability: Availability
  distributionMode: DistributionMode
  /** Items sharing a group are the same question; exposure to one exposes all. */
  duplicateGroupId: string
  reservedForMock: boolean
  provenance: Provenance
  /** Why an item is quarantined, shown in the coverage report. */
  quarantineReason: string | null
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

export interface WritingPrompt {
  id: string
  version: number
  provenance: Provenance
  locator: SourceLocator | null
  statement: string
  /** This prompt's own tasks — not boilerplate repeated for every prompt. */
  requirements: string[]
  /** App-authored, reviewed coaching material shown only on reveal. */
  coaching: {
    status: 'app-authored-reviewed' | 'app-authored-draft' | 'none'
    approaches: { heading: string; body: string }[]
    counterpoints: string[]
    checklist: string[]
  }
  skillIds: string[]
  availability: Availability
}

/* ------------------------------------------------------------------ */
/* Learner records                                                     */
/* ------------------------------------------------------------------ */

export type Confidence = 'unsure' | 'likely' | 'certain'

export type AttemptOutcome = 'correct' | 'incorrect' | 'unscored'

export type ErrorLabel =
  | 'misread-prompt'
  | 'missed-condition'
  | 'wrong-method'
  | 'calculation'
  | 'time-pressure'
  | 'guessed'
  | 'other'

export interface Attempt {
  id: string
  questionId: string
  questionVersion: number
  duplicateGroupId: string
  sessionId: string | null
  selectedOptionId: string | null
  outcome: AttemptOutcome
  startedAt: number
  submittedAt: number
  /** Milliseconds actively on the question. */
  durationMs: number
  confidence: Confidence | null
  /** True when the learner revealed the back before committing an answer. */
  revealedBeforeAnswer: boolean
  usedHint: boolean
  errorLabels: ErrorLabel[]
  note: string | null
  /**
   * True only when the duplicate group was unexposed before this session,
   * the learner answered before revealing, and no assistance was used.
   */
  freshFirstAttempt: boolean
  /** Snapshot so later re-tagging cannot rewrite history. */
  primarySkillIdSnapshot: string
  componentIdSnapshot: ComponentId
  /** Fixture attempts are excluded from performance reporting by default. */
  provenanceSnapshot: Provenance
  timingSetting: TimingSetting
}

export type ExposureReason =
  | 'prompt-viewed'
  | 'answer-revealed'
  | 'model-plan-viewed'
  | 'external-self-reported'

export interface Exposure {
  id: string
  itemId: string
  duplicateGroupId: string
  at: number
  reason: ExposureReason
  sessionId: string | null
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export type SessionMode =
  | 'quick'
  | 'custom'
  | 'diagnostic'
  | 'review'
  | 'timed-module'
  | 'full-rehearsal'
  | 'writing'

export type SessionStatus = 'active' | 'submitted' | 'expired' | 'abandoned'

export interface TimingSetting {
  /** 'untimed' | 'soft' (advisory clock) | 'strict' (enforced deadline) */
  kind: 'untimed' | 'soft' | 'strict'
  /** 1 = standard. Results are grouped by multiplier, never pooled. */
  multiplier: number
  /** True only for the separately labelled training mode. */
  pausable: boolean
}

export interface SessionStage {
  id: string
  kind: 'module' | 'writing'
  label: string
  componentId: ComponentId
  /** Question ids (module) or candidate prompt ids (writing). */
  itemIds: string[]
  itemVersions: Record<string, number>
  allowedMs: number
  /** Absolute epoch ms. Remaining time is always derived from this. */
  startedAt: number | null
  deadlineAt: number | null
  submittedAt: number | null
  status: 'pending' | 'active' | 'submitted' | 'expired'
  /** Accumulated paused time, training mode only. */
  pausedMs: number
  pausedAt: number | null
}

export interface Session {
  id: string
  mode: SessionMode
  createdAt: number
  seed: string
  timing: TimingSetting
  stages: SessionStage[]
  activeStageIndex: number
  /** questionId -> optionId, persisted immediately on every change. */
  answers: Record<string, string | null>
  /** questionId -> true */
  flagged: Record<string, boolean>
  status: SessionStatus
  submittedAt: number | null
  /** Duplicate groups already exposed when the session began. */
  exposedGroupsAtStart: string[]
  /** Skills requested, for reporting what the learner asked for. */
  requestedSkillIds: string[]
  /** Set when the learner knowingly started with previously seen material. */
  disclosedSeenCount: number
  essayId: string | null
  /** Which content-pack versions this session's items came from. */
  contentVersions: Record<string, number>
}

/* ------------------------------------------------------------------ */
/* Essays                                                              */
/* ------------------------------------------------------------------ */

export interface EssayRevision {
  id: string
  at: number
  text: string
  wordCount: number
  /** True when the 750-word snapshot was cut from a longer draft at expiry. */
  truncated: boolean
  /** Full text preserved even when the submitted snapshot was truncated. */
  archivedFullText: string | null
  reason: 'manual-submit' | 'expiry' | 'revision'
}

export interface FeedbackRecord {
  id: string
  at: number
  revisionId: string
  rubricVersion: string
  provider: string
  strengths: string[]
  improvements: { heading: string; detail: string; excerpt: string }[]
  dimensions: { name: string; label: 'clear' | 'developing' | 'missing'; note: string }[]
  suggestedExercise: string
  /** Excerpts that could not be found verbatim in the draft are dropped and counted. */
  droppedExcerpts: number
}

export interface Essay {
  id: string
  promptId: string
  promptVersion: number
  sessionId: string | null
  createdAt: number
  plan: string
  text: string
  wordCount: number
  lastSavedAt: number | null
  revisions: EssayRevision[]
  feedback: FeedbackRecord[]
  status: 'draft' | 'submitted'
  /** Practice preset used, for honest comparison grouping. */
  timing: TimingSetting
}

/* ------------------------------------------------------------------ */
/* Review scheduling and preferences                                   */
/* ------------------------------------------------------------------ */

/** Interval ladder in days. Configuration, not exam guidance. */
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const

export interface ReviewState {
  /** Keyed by duplicate group so variants do not both come due. */
  groupId: string
  itemId: string
  dueAt: number
  /** Index into REVIEW_INTERVAL_DAYS. */
  stage: number
  lastOutcome: AttemptOutcome
  lastReviewedAt: number
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface Preferences {
  id: 'singleton'
  testDate: string | null
  weeklyTargetMinutes: number | null
  dailyMinutes: number | null
  theme: ThemePreference
  reducedMotion: boolean
  timing: TimingSetting
  /** Off by default: development fixtures are not exam material. */
  includeFixturesInProgress: boolean
  onboardingDismissed: boolean
  aiFeedbackEndpoint: string | null
}

/** Manually recorded results from material studied outside the app. */
export interface SelfReport {
  id: string
  sourceId: string
  at: number
  label: string
  correct: number | null
  total: number | null
  note: string
  componentId: ComponentId | null
}

export type ProvisionalStatus =
  | 'not-started'
  | 'gathering-evidence'
  | 'needs-practice'
  | 'improving'
  | 'consistent-recently'
