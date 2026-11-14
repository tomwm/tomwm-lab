import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// ─── Texts ──────────────────────────────────────────────────────────────────
// One workspace per text. Course assignment (exam component vs coursework) is
// deliberately nullable and NEVER guessed — it stays "unassigned" until the
// student/teacher confirms it in Settings.

export const texts = sqliteTable("texts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  textType: text("text_type", {
    enum: ["novel", "play", "poetry_collection"],
  }).notNull(),
  // How this text's contents are organised — drives which structure view renders.
  structureMode: text("structure_mode", {
    enum: ["chapters", "acts_scenes", "narration_vs_chronology", "poems"],
  }).notNull(),
  qualificationCode: text("qualification_code").notNull().default("H472"),
  assessmentComponent: text("assessment_component", {
    enum: ["exam", "coursework"],
  }), // null = unassigned, on purpose
  assessmentComponentNote: text("assessment_component_note"),
  summary: text("summary"),
  accentKey: text("accent_key").notNull().default("info"),
  createdAt: integer("created_at").notNull(),
});

// ─── Structure nodes ────────────────────────────────────────────────────────
// Chapters / acts / scenes / poems / dated documents. Self-referential for
// act -> scene nesting. `track` lets a play carry parallel plots (Lear /
// Gloucester) as views over the same sequence rather than separate lists.
// Chronology fields are OPTIONAL and separate from narrative order, so a text
// like Beloved can say "told here, happened earlier, exact date unknown"
// without forcing a fake precise date.

export const structureNodes = sqliteTable(
  "structure_nodes",
  {
    id: text("id").primaryKey(),
    textId: text("text_id")
      .notNull()
      .references(() => texts.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    kind: text("kind", {
      enum: ["act", "scene", "chapter", "document", "poem", "section", "movement"],
    }).notNull(),
    title: text("title").notNull(),
    locationRef: text("location_ref").notNull(), // edition-independent, e.g. "Act 3, Scene 2" / "Ch. 11"
    track: text("track"), // e.g. "lear_plot" | "gloucester_plot" | null = shared/main
    orderIndex: integer("order_index").notNull(), // narrative / reading order
    chronologyOrderIndex: integer("chronology_order_index"), // null = uncertain / not placed
    chronologyLabel: text("chronology_label"), // free text, e.g. "~18 years before the novel's present, date uncertain"
    dateInWorld: text("date_in_world"), // for dated-document texts like Dracula
    narratorOrPov: text("narrator_or_pov"),
    summary: text("summary"),
    significance: text("significance"), // what changes / why it matters
    isRealWorldEvent: integer("is_real_world_event", { mode: "boolean" })
      .notNull()
      .default(false), // publication/performance history, kept apart from in-world events
    // Structure is a seeded default she can restructure: add beats, split
    // chapters, delete what doesn't help. These two flags keep provenance
    // honest — what the app supplied vs what she added, and what the app
    // isn't certain enough about to state as fact.
    isUserAdded: integer("is_user_added", { mode: "boolean" }).notNull().default(false),
    needsVerification: integer("needs_verification", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("structure_text_idx").on(t.textId)]
);

// ─── Cards ──────────────────────────────────────────────────────────────────

// Note: there is deliberately no "scene" card type. Scenes/chapters live as
// structure nodes — having both was a duplicate representation of the same
// thing. "method" covers the writer's craft (form, structure, narrative
// technique), which AO2 asks for and which otherwise gets miscategorised as theme.
export const CARD_TYPES = [
  "evidence",
  "method",
  "theme",
  "character",
  "context",
  "interpretation",
  "comparison",
  "performance",
] as const;
export type CardType = (typeof CARD_TYPES)[number];

export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey(),
    type: text("type", { enum: CARD_TYPES }).notNull(),
    title: text("title").notNull(),
    primaryTextId: text("primary_text_id").references(() => texts.id, {
      onDelete: "set null",
    }),
    locationRef: text("location_ref"), // edition-independent reference

    // Evidence-specific, but harmless elsewhere: exact quotation is kept
    // separate from analysis and is never silently edited by the app.
    quoteText: text("quote_text"),
    quoteVerified: integer("quote_verified", { mode: "boolean" })
      .notNull()
      .default(false), // true only for quotes the app shipped as verified
    speakerOrNarrator: text("speaker_or_narrator"),

    // The student's own explanation / notes, always editable, always hers.
    studentExplanation: text("student_explanation"),

    // Context / performance / interpretation-specific sourcing.
    sourceNote: text("source_note"),

    // Who wrote this — and nothing else. Reliability lives in `confidence`,
    // and citability in `sourceNote`. An earlier three-value version split the
    // app's own cards by how sure it was, which just duplicated `confidence`
    // (they ran 98% correlated) and made two badges assert the same thing.
    provenance: text("provenance", {
      enum: ["app_written", "student"],
    })
      .notNull()
      .default("student"),

    confidence: text("confidence", {
      enum: ["solid", "tentative", "needs_checking"],
    })
      .notNull()
      .default("tentative"),

    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),

    isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("cards_text_idx").on(t.primaryTextId),
    index("cards_type_idx").on(t.type),
  ]
);

// Cards spanning multiple texts (comparison cards, cross-text themes).
export const cardTexts = sqliteTable(
  "card_texts",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    textId: text("text_id")
      .notNull()
      .references(() => texts.id, { onDelete: "cascade" }),
    roleNote: text("role_note"),
  },
  (t) => [index("card_texts_card_idx").on(t.cardId)]
);

// Which sections of the text a card relates to. Many-to-many because most
// card types legitimately span several places: a theme runs across a dozen
// scenes, a method converges at three, an evidence card sits at exactly one,
// and a context card often belongs nowhere in particular.
//
// This replaces two earlier mechanisms it subsumes: a single-valued
// cards.structureNodeId, and a character-only node/card join that drove the
// presence grid. The grid is now just this table filtered to character cards.
export const cardStructureNodes = sqliteTable(
  "card_structure_nodes",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    structureNodeId: text("structure_node_id")
      .notNull()
      .references(() => structureNodes.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("csn_card_idx").on(t.cardId),
    index("csn_node_idx").on(t.structureNodeId),
  ]
);

// Edit history — every save snapshots the previous state.
export const cardVersions = sqliteTable(
  "card_versions",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    snapshot: text("snapshot", { mode: "json" }).notNull(),
    editSummary: text("edit_summary"),
    editedAt: integer("edited_at").notNull(),
  },
  (t) => [index("card_versions_card_idx").on(t.cardId)]
);

// ─── Relationships between cards ───────────────────────────────────────────

export const RELATIONS = [
  "supports",
  "challenges",
  "contrasts_with",
  "develops",
  "foreshadows",
  "provides_context_for",
] as const;
export type Relation = (typeof RELATIONS)[number];

export const cardLinks = sqliteTable(
  "card_links",
  {
    id: text("id").primaryKey(),
    fromCardId: text("from_card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    toCardId: text("to_card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    relation: text("relation", { enum: RELATIONS }).notNull(),
    explanation: text("explanation"), // her own words on why this link matters
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("card_links_from_idx").on(t.fromCardId),
    index("card_links_to_idx").on(t.toCardId),
  ]
);

// ─── Spaced retrieval practice ──────────────────────────────────────────────

export const PROMPT_TYPES = [
  "recall",
  "evidence_retrieval",
  "explain_effect",
  "alternative_reading",
  "context_link",
  "comparison",
  "thesis",
  "paragraph",
  "close_reading",
] as const;
export type PromptType = (typeof PROMPT_TYPES)[number];

export const reviewStates = sqliteTable(
  "review_states",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    promptType: text("prompt_type", { enum: PROMPT_TYPES }).notNull(),
    easeFactor: integer("ease_factor").notNull().default(250), // x100, SM-2 style
    intervalDays: integer("interval_days").notNull().default(0),
    dueAt: integer("due_at").notNull(),
    reviewCount: integer("review_count").notNull().default(0),
    lastResult: text("last_result", {
      enum: ["again", "hard", "good", "easy"],
    }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("review_states_card_idx").on(t.cardId),
    index("review_states_due_idx").on(t.dueAt),
  ]
);

export const reviewLog = sqliteTable(
  "review_log",
  {
    id: text("id").primaryKey(),
    reviewStateId: text("review_state_id")
      .notNull()
      .references(() => reviewStates.id, { onDelete: "cascade" }),
    result: text("result", { enum: ["again", "hard", "good", "easy"] }).notNull(),
    responseText: text("response_text"),
    reviewedAt: integer("reviewed_at").notNull(),
  },
  (t) => [index("review_log_state_idx").on(t.reviewStateId)]
);

// ─── Essays ─────────────────────────────────────────────────────────────────

export const essays = sqliteTable(
  "essays",
  {
    id: text("id").primaryKey(),
    parentEssayId: text("parent_essay_id"), // set when this is a revision of an earlier attempt
    questionText: text("question_text").notNull(),
    questionType: text("question_type"), // free text — component not yet confirmed
    marksAvailable: integer("marks_available"), // null = unknown; withhold indicative mark until supplied
    assessmentObjectives: text("assessment_objectives"), // free text, e.g. "AO1, AO2, AO5"
    textIds: text("text_ids", { mode: "json" }).$type<string[]>().notNull(),
    extractText: text("extract_text"),
    timed: integer("timed", { mode: "boolean" }).notNull().default(false),
    openBook: integer("open_book", { mode: "boolean" }).notNull().default(true),
    completedWithHelp: integer("completed_with_help", { mode: "boolean" })
      .notNull()
      .default(false),
    minutesTaken: integer("minutes_taken"),
    submittedText: text("submitted_text").notNull(),
    status: text("status", {
      enum: ["draft", "submitted", "marked", "revised"],
    })
      .notNull()
      .default("submitted"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("essays_parent_idx").on(t.parentEssayId)]
);

export const essayFeedback = sqliteTable(
  "essay_feedback",
  {
    id: text("id").primaryKey(),
    essayId: text("essay_id")
      .notNull()
      .references(() => essays.id, { onDelete: "cascade" }),
    source: text("source", { enum: ["ai", "teacher"] }).notNull(),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    aiModel: text("ai_model"),
    aiConfigVersion: text("ai_config_version"),
    mark: integer("mark"),
    maxMark: integer("max_mark"),
    levelLabel: text("level_label"),
    missingForMark: text("missing_for_mark"), // filled instead of a mark when info is insufficient
    strengths: text("strengths", { mode: "json" })
      .$type<{ point: string; anchor: string | null }[]>()
      .notNull()
      .default([]),
    improvements: text("improvements", { mode: "json" })
      .$type<{ point: string; anchor: string | null }[]>()
      .notNull()
      .default([]),
    anchoredComments: text("anchored_comments", { mode: "json" })
      .$type<{ excerpt: string; comment: string }[]>()
      .notNull()
      .default([]),
    revisionTask: text("revision_task"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("essay_feedback_essay_idx").on(t.essayId)]
);

// The "develop the idea further" coaching loop, tied to one piece of feedback.
export const developMoments = sqliteTable(
  "develop_moments",
  {
    id: text("id").primaryKey(),
    essayFeedbackId: text("essay_feedback_id")
      .notNull()
      .references(() => essayFeedback.id, { onDelete: "cascade" }),
    essayExcerpt: text("essay_excerpt").notNull(), // the exact sentence(s) where the idea stalls
    promptQuestion: text("prompt_question").notNull(), // concrete question about her sentence, not "analyse more"
    moveType: text("move_type", {
      enum: [
        "implication",
        "tension",
        "language_form",
        "alternative_reading",
        "audience_effect",
        "return_to_argument",
      ],
    }).notNull(),
    studentResponse: text("student_response"),
    exampleRequested: integer("example_requested", { mode: "boolean" })
      .notNull()
      .default(false),
    exampleText: text("example_text"),
    savedAsCardId: text("saved_as_card_id"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("develop_moments_feedback_idx").on(t.essayFeedbackId)]
);
