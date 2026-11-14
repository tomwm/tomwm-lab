"use server";

import { db } from "@/db/client";
import {
  cards,
  cardLinks,
  cardTexts,
  cardVersions,
  reviewStates,
  reviewLog,
  essays,
  essayFeedback,
  developMoments,
  texts,
  structureNodes,
  cardStructureNodes,
  type CardType,
  type Relation,
} from "@/db/schema";
import { newId } from "@/lib/ids";
import { SPARE_ACCENT_KEYS } from "@/lib/utils";
import { schedule, type ReviewResult } from "@/lib/srs";
import { generatePromptsForCard } from "@/lib/practice";
import { markEssay } from "@/lib/ai/marking";
import { getAiProvider } from "@/lib/ai/provider";
import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Cards ──────────────────────────────────────────────────────────────────

export interface CardInput {
  type: CardType;
  title: string;
  primaryTextId: string | null;
  additionalTextIds?: string[];
  /** Sections of the text this card relates to. */
  structureNodeIds?: string[];
  locationRef?: string | null;
  quoteText?: string | null;
  speakerOrNarrator?: string | null;
  studentExplanation?: string | null;
  sourceNote?: string | null;
  confidence?: "solid" | "tentative" | "needs_checking";
  tags?: string[];
}

export async function createCard(input: CardInput) {
  const id = newId("card");
  const now = Date.now();
  await db.insert(cards).values({
    id,
    type: input.type,
    title: input.title,
    primaryTextId: input.primaryTextId,
    locationRef: input.locationRef ?? null,
    quoteText: input.quoteText ?? null,
    quoteVerified: false,
    speakerOrNarrator: input.speakerOrNarrator ?? null,
    studentExplanation: input.studentExplanation ?? null,
    sourceNote: input.sourceNote ?? null,
    provenance: "student",
    confidence: input.confidence ?? "tentative",
    tags: input.tags ?? [],
    isPinned: false,
    createdAt: now,
    updatedAt: now,
  });

  if (input.additionalTextIds?.length) {
    for (const textId of input.additionalTextIds) {
      await db.insert(cardTexts).values({ id: newId("ctx"), cardId: id, textId, roleNote: null });
    }
  }

  for (const nodeId of input.structureNodeIds ?? []) {
    await db.insert(cardStructureNodes).values({ id: newId("csn"), cardId: id, structureNodeId: nodeId });
  }

  // Seed retrieval prompts for the new card so it enters the practice queue.
  const generated = generatePromptsForCard({
    type: input.type,
    title: input.title,
    locationRef: input.locationRef ?? null,
    speakerOrNarrator: input.speakerOrNarrator ?? null,
    hasQuote: !!input.quoteText,
  });
  for (const p of generated) {
    await db.insert(reviewStates).values({
      id: newId("rs"),
      cardId: id,
      promptType: p.promptType,
      easeFactor: 250,
      intervalDays: 0,
      dueAt: now,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/");
  return id;
}

export async function updateCard(id: string, input: Partial<CardInput> & { editSummary?: string }) {
  const existing = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  if (!existing[0]) throw new Error("Card not found");

  await db.insert(cardVersions).values({
    id: newId("cv"),
    cardId: id,
    snapshot: existing[0],
    editSummary: input.editSummary ?? null,
    editedAt: Date.now(),
  });

  const { editSummary: _es, additionalTextIds: _atids, structureNodeIds, ...rest } = input;
  void _es;
  void _atids;

  if (structureNodeIds) {
    await db.delete(cardStructureNodes).where(eq(cardStructureNodes.cardId, id));
    for (const nodeId of structureNodeIds) {
      await db.insert(cardStructureNodes).values({ id: newId("csn"), cardId: id, structureNodeId: nodeId });
    }
  }

  // Once she rewrites a seeded card it's hers, so the app stops presenting it
  // as its own vouched-for reference material.
  const contentChanged =
    (rest.title !== undefined && rest.title !== existing[0].title) ||
    (rest.studentExplanation !== undefined && rest.studentExplanation !== existing[0].studentExplanation) ||
    (rest.quoteText !== undefined && rest.quoteText !== existing[0].quoteText);
  const provenance =
    contentChanged && existing[0].provenance !== "student" ? { provenance: "student" as const } : {};

  await db
    .update(cards)
    .set({ ...rest, ...provenance, updatedAt: Date.now() })
    .where(eq(cards.id, id));

  // Adding a quotation to a previously-blank evidence card makes it
  // practisable, so top up any prompts that have now become answerable.
  const updated = (await db.select().from(cards).where(eq(cards.id, id)).limit(1))[0];
  if (updated) {
    const applicable = generatePromptsForCard({
      type: updated.type,
      title: updated.title,
      locationRef: updated.locationRef,
      speakerOrNarrator: updated.speakerOrNarrator,
      hasQuote: !!updated.quoteText,
    });
    const existingPrompts = await db.select().from(reviewStates).where(eq(reviewStates.cardId, id));
    const have = new Set(existingPrompts.map((r) => r.promptType));
    const now = Date.now();
    for (const p of applicable) {
      if (have.has(p.promptType)) continue;
      await db.insert(reviewStates).values({
        id: newId("rs"),
        cardId: id,
        promptType: p.promptType,
        easeFactor: 250,
        intervalDays: 0,
        dueAt: now,
        reviewCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  revalidatePath("/");
}

export async function deleteCard(id: string) {
  await db.delete(cards).where(eq(cards.id, id));
  revalidatePath("/");
}

export async function createCardLink(fromCardId: string, toCardId: string, relation: Relation, explanation: string | null) {
  await db.insert(cardLinks).values({
    id: newId("cl"),
    fromCardId,
    toCardId,
    relation,
    explanation,
    createdAt: Date.now(),
  });
  revalidatePath("/");
}

export async function deleteCardLink(id: string) {
  await db.delete(cardLinks).where(eq(cardLinks.id, id));
  revalidatePath("/");
}

// ─── Practice / retrieval ───────────────────────────────────────────────────

export async function recordReview(reviewStateId: string, result: ReviewResult, responseText?: string) {
  const rows = await db.select().from(reviewStates).where(eq(reviewStates.id, reviewStateId)).limit(1);
  const state = rows[0];
  if (!state) throw new Error("Review state not found");

  const next = schedule(
    { easeFactor: state.easeFactor, intervalDays: state.intervalDays, reviewCount: state.reviewCount },
    result
  );

  await db
    .update(reviewStates)
    .set({
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      reviewCount: next.reviewCount,
      dueAt: next.dueAt,
      lastResult: result,
      updatedAt: Date.now(),
    })
    .where(eq(reviewStates.id, reviewStateId));

  await db.insert(reviewLog).values({
    id: newId("rl"),
    reviewStateId,
    result,
    responseText: responseText ?? null,
    reviewedAt: Date.now(),
  });

  revalidatePath("/practice");
}

/**
 * Put a writing prompt aside without recording a result.
 *
 * Skipping a close reading because there isn't time says nothing about what
 * she knows, so ease, interval and review count are untouched and nothing is
 * logged. It only moves the due date back a day — left due now, the prompt
 * would sit at the front of every session's queue (sorted by due date) until
 * she did it. Never pulls a prompt earlier than it was already due.
 */
export async function skipReview(reviewStateId: string) {
  const rows = await db.select().from(reviewStates).where(eq(reviewStates.id, reviewStateId)).limit(1);
  const state = rows[0];
  if (!state) throw new Error("Review state not found");

  const now = Date.now();
  await db
    .update(reviewStates)
    .set({ dueAt: Math.max(state.dueAt, now + 24 * 60 * 60 * 1000), updatedAt: now })
    .where(eq(reviewStates.id, reviewStateId));

  revalidatePath("/practice");
}

// ─── Structure nodes (editable narrative structure) ────────────────────────
// The seeded structure is a starting point, not a fixed schema — she can add
// beats, rename, reorder and delete as her reading of the text develops.

export interface StructureNodeInput {
  textId: string;
  kind: "act" | "scene" | "chapter" | "document" | "poem" | "section" | "movement";
  title: string;
  locationRef: string;
  track?: string | null;
  narratorOrPov?: string | null;
  summary?: string | null;
  significance?: string | null;
  chronologyLabel?: string | null;
  dateInWorld?: string | null;
  isRealWorldEvent?: boolean;
  /** Insert directly after this node; omit to append at the end. */
  insertAfterNodeId?: string | null;
}

export async function createStructureNode(input: StructureNodeInput) {
  const allSiblings = await db
    .select()
    .from(structureNodes)
    .where(eq(structureNodes.textId, input.textId))
    .orderBy(asc(structureNodes.orderIndex));

  // Publication/performance history sits in its own high order range and is
  // never part of the in-world sequence, so it must not affect positioning.
  const siblings = input.isRealWorldEvent
    ? allSiblings.filter((s) => s.isRealWorldEvent)
    : allSiblings.filter((s) => !s.isRealWorldEvent);

  const base = input.isRealWorldEvent ? 1000 : 1;
  let position: number;
  if (input.insertAfterNodeId) {
    const anchor = siblings.find((s) => s.id === input.insertAfterNodeId);
    position = anchor ? anchor.orderIndex + 1 : base + siblings.length;
  } else {
    position = base + siblings.length;
  }

  // Shift everything at or after the insertion point down by one so order
  // indices stay contiguous.
  for (const sibling of siblings) {
    if (sibling.orderIndex >= position) {
      await db
        .update(structureNodes)
        .set({ orderIndex: sibling.orderIndex + 1, updatedAt: Date.now() })
        .where(eq(structureNodes.id, sibling.id));
    }
  }

  const id = newId("node");
  const now = Date.now();
  await db.insert(structureNodes).values({
    id,
    textId: input.textId,
    parentId: null,
    kind: input.kind,
    title: input.title,
    locationRef: input.locationRef,
    track: input.track ?? null,
    orderIndex: position,
    chronologyOrderIndex: null,
    chronologyLabel: input.chronologyLabel ?? null,
    dateInWorld: input.dateInWorld ?? null,
    narratorOrPov: input.narratorOrPov ?? null,
    summary: input.summary ?? null,
    significance: input.significance ?? null,
    isRealWorldEvent: input.isRealWorldEvent ?? false,
    isUserAdded: true,
    needsVerification: false,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/");
  return id;
}

export async function updateStructureNode(
  id: string,
  patch: Partial<Omit<StructureNodeInput, "textId" | "insertAfterNodeId">> & { needsVerification?: boolean }
) {
  await db
    .update(structureNodes)
    .set({ ...patch, updatedAt: Date.now() })
    .where(eq(structureNodes.id, id));
  revalidatePath("/");
}

export async function deleteStructureNode(id: string) {
  const rows = await db.select().from(structureNodes).where(eq(structureNodes.id, id)).limit(1);
  const node = rows[0];
  if (!node) return;

  await db.delete(structureNodes).where(eq(structureNodes.id, id));

  // Close the gap left behind so order indices stay contiguous.
  const remaining = await db
    .select()
    .from(structureNodes)
    .where(eq(structureNodes.textId, node.textId))
    .orderBy(asc(structureNodes.orderIndex));
  for (const sibling of remaining) {
    if (sibling.orderIndex > node.orderIndex) {
      await db
        .update(structureNodes)
        .set({ orderIndex: sibling.orderIndex - 1, updatedAt: Date.now() })
        .where(eq(structureNodes.id, sibling.id));
    }
  }

  revalidatePath("/");
}


/** Binds or unbinds a card to a section. Used by the presence grid, and by
 *  anything else that needs to attach a card to a place in the text. */
export async function toggleCardSection(structureNodeId: string, cardId: string) {
  const existing = await db
    .select()
    .from(cardStructureNodes)
    .where(and(eq(cardStructureNodes.structureNodeId, structureNodeId), eq(cardStructureNodes.cardId, cardId)))
    .limit(1);

  if (existing[0]) {
    await db.delete(cardStructureNodes).where(eq(cardStructureNodes.id, existing[0].id));
  } else {
    await db.insert(cardStructureNodes).values({ id: newId("csn"), cardId, structureNodeId });
  }
  revalidatePath("/");
}

// ─── Texts ──────────────────────────────────────────────────────────────────

export type StructureMode = "chapters" | "acts_scenes" | "narration_vs_chronology" | "poems";

// How a text is organised is the only structural question worth asking — it
// decides which Overview layout renders. `textType` is derived rather than
// asked for separately, since nothing reads it independently.
const TEXT_TYPE_FOR_MODE: Record<StructureMode, "novel" | "play" | "poetry_collection"> = {
  chapters: "novel",
  acts_scenes: "play",
  narration_vs_chronology: "novel",
  poems: "poetry_collection",
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createText(input: {
  title: string;
  author: string;
  structureMode: StructureMode;
  summary?: string | null;
}) {
  const existing = await db.select().from(texts);

  // Slugs are the URL, so they have to be unique.
  const base = slugify(input.title) || "text";
  let slug = base;
  let n = 2;
  while (existing.some((t) => t.slug === slug)) slug = `${base}-${n++}`;

  // Give each text its own colour where one is free — it's how texts are
  // identified at a glance in the needs-checking list and thread pages.
  const used = new Set(existing.map((t) => t.accentKey));
  const accentKey = SPARE_ACCENT_KEYS.find((k) => !used.has(k)) ?? "info";

  const id = newId("text");
  await db.insert(texts).values({
    id,
    slug,
    title: input.title.trim(),
    author: input.author.trim(),
    textType: TEXT_TYPE_FOR_MODE[input.structureMode],
    structureMode: input.structureMode,
    qualificationCode: "H472",
    assessmentComponent: null,
    assessmentComponentNote: null,
    summary: input.summary?.trim() || null,
    accentKey,
    createdAt: Date.now(),
  });

  revalidatePath("/");
  revalidatePath("/settings");
  return slug;
}

/**
 * Permanently deletes a text and everything belonging to it.
 *
 * Cards must be deleted explicitly rather than left to the foreign key:
 * `cards.primaryTextId` is ON DELETE SET NULL, so relying on the cascade would
 * orphan every card — invisible in the workspace, but still turning up in the
 * practice queue and the needs-checking list attached to a text that no longer
 * exists. Deleting them takes their links, versions, prompts and section
 * bindings with them.
 *
 * Essays are deliberately left alone. They're her writing, and one about a
 * text she's since removed is still worth keeping.
 */
export async function deleteText(textId: string) {
  const owned = await db.select({ id: cards.id }).from(cards).where(eq(cards.primaryTextId, textId));
  for (const c of owned) {
    await db.delete(cards).where(eq(cards.id, c.id));
  }

  // Sections, and any cross-text references from comparison cards, cascade.
  await db.delete(texts).where(eq(texts.id, textId));

  revalidatePath("/");
  revalidatePath("/settings");
}

// ─── Course configuration ───────────────────────────────────────────────────

export async function setTextAssessmentComponent(
  textId: string,
  component: "exam" | "coursework" | null,
  note: string | null
) {
  await db.update(texts).set({ assessmentComponent: component, assessmentComponentNote: note }).where(eq(texts.id, textId));
  revalidatePath("/settings");
}

// ─── Essays ─────────────────────────────────────────────────────────────────

export interface EssaySubmissionInput {
  parentEssayId?: string | null;
  questionText: string;
  questionType?: string | null;
  marksAvailable?: number | null;
  assessmentObjectives?: string | null;
  textIds: string[];
  extractText?: string | null;
  timed: boolean;
  openBook: boolean;
  completedWithHelp: boolean;
  minutesTaken?: number | null;
  submittedText: string;
}

export async function submitEssay(input: EssaySubmissionInput) {
  const id = newId("essay");
  const now = Date.now();

  await db.insert(essays).values({
    id,
    parentEssayId: input.parentEssayId ?? null,
    questionText: input.questionText,
    questionType: input.questionType ?? null,
    marksAvailable: input.marksAvailable ?? null,
    assessmentObjectives: input.assessmentObjectives ?? null,
    textIds: input.textIds,
    extractText: input.extractText ?? null,
    timed: input.timed,
    openBook: input.openBook,
    completedWithHelp: input.completedWithHelp,
    minutesTaken: input.minutesTaken ?? null,
    submittedText: input.submittedText,
    status: "submitted",
    createdAt: now,
  });

  const textTitles = (
    await Promise.all(input.textIds.map((tid) => db.select().from(texts).where(eq(texts.id, tid)).limit(1)))
  )
    .map((r) => r[0]?.title)
    .filter(Boolean) as string[];

  let priorFeedbackSummary: string | undefined;
  if (input.parentEssayId) {
    const prior = await db
      .select()
      .from(essayFeedback)
      .where(eq(essayFeedback.essayId, input.parentEssayId))
      .limit(1);
    priorFeedbackSummary = prior[0]?.revisionTask ?? undefined;
  }

  const result = await markEssay({
    questionText: input.questionText,
    questionType: input.questionType ?? null,
    marksAvailable: input.marksAvailable ?? null,
    assessmentObjectives: input.assessmentObjectives ?? null,
    extractText: input.extractText ?? null,
    timed: input.timed,
    openBook: input.openBook,
    completedWithHelp: input.completedWithHelp,
    submittedText: input.submittedText,
    textTitles,
    priorFeedbackSummary,
  });

  const feedbackId = newId("fb");
  await db.insert(essayFeedback).values({
    id: feedbackId,
    essayId: id,
    source: "ai",
    isDemo: result.isDemo,
    aiModel: result.model,
    aiConfigVersion: "v1",
    mark: result.mark,
    maxMark: result.maxMark,
    levelLabel: result.levelLabel,
    missingForMark: result.missingForMark,
    strengths: result.strengths,
    improvements: result.improvements,
    anchoredComments: result.anchoredComments,
    revisionTask: result.revisionTask,
    createdAt: now,
  });

  if (result.developMoment) {
    await db.insert(developMoments).values({
      id: newId("dm"),
      essayFeedbackId: feedbackId,
      essayExcerpt: result.developMoment.essayExcerpt,
      promptQuestion: result.developMoment.promptQuestion,
      moveType: result.developMoment.moveType,
      createdAt: now,
    });
  }

  await db.update(essays).set({ status: "marked" }).where(eq(essays.id, id));

  revalidatePath("/essays");
  return id;
}

export async function submitDevelopResponse(developMomentId: string, studentResponse: string) {
  await db.update(developMoments).set({ studentResponse }).where(eq(developMoments.id, developMomentId));
  revalidatePath("/essays");
}

/**
 * Delete one essay attempt, with its feedback and develop moments (both cascade).
 *
 * Revisions point back through parentEssayId, which isn't a foreign key, so
 * nothing cascades along the chain. Any later attempt is re-linked to this one's
 * parent first — deleting attempt 2 of 3 leaves 1 → 3 rather than splitting the
 * history in two or leaving attempt 3 pointing at nothing.
 *
 * Cards she saved from a develop moment are her own notes and are left alone.
 */
export async function deleteEssay(essayId: string) {
  const rows = await db.select().from(essays).where(eq(essays.id, essayId)).limit(1);
  const essay = rows[0];
  if (!essay) return;

  await db
    .update(essays)
    .set({ parentEssayId: essay.parentEssayId })
    .where(eq(essays.parentEssayId, essayId));
  await db.delete(essays).where(eq(essays.id, essayId));

  revalidatePath("/essays");
  revalidatePath("/");
}

export async function requestDevelopExample(developMomentId: string) {
  const rows = await db.select().from(developMoments).where(eq(developMoments.id, developMomentId)).limit(1);
  const moment = rows[0];
  if (!moment) throw new Error("Not found");

  const provider = getAiProvider();
  let exampleText: string;

  if (!provider.configured) {
    exampleText =
      "No AI provider is configured, so here's a generic pattern instead of a live example: take the implication you just wrote, then add one sentence naming a specific effect on the reader or audience, and one sentence considering whether that effect could cut the other way.";
  } else {
    try {
      const { text } = await provider.complete(
        "You are an English Literature teacher. The student has already attempted to extend an analytical point herself. Give ONE short worked example (2-3 sentences) of the specific move requested, in your own words, clearly distinct from her essay. Do not rewrite her paragraph — show the move in general terms she can adapt. Never invent quotations, critics, or facts.",
        `Original stalled point: "${moment.essayExcerpt}"\nQuestion asked: "${moment.promptQuestion}"\nHer attempt: "${moment.studentResponse ?? "(no attempt given)"}"\n\nGive one short example of the analytical move.`
      );
      exampleText = text.trim();
    } catch {
      exampleText = "The live request failed — try again shortly, or attempt the move again yourself first.";
    }
  }

  await db.update(developMoments).set({ exampleRequested: true, exampleText }).where(eq(developMoments.id, developMomentId));
  revalidatePath("/essays");
  return exampleText;
}

/**
 * Turns a cross-text tag into a comparison card — the artifact that actually
 * carries AO4 marks. A shared tag only says "both texts touch this"; the
 * comparison card is where the specific, arguable difference gets written.
 */
export async function createComparisonFromTag(tag: string, textIds: string[], title: string) {
  if (textIds.length < 2) throw new Error("A comparison needs at least two texts");

  const involved = await db.select().from(texts).where(inArray(texts.id, textIds));
  const titles = involved.map((t) => t.title);

  const id = await createCard({
    type: "comparison",
    title,
    primaryTextId: textIds[0],
    additionalTextIds: textIds.slice(1),
    tags: [tag],
    confidence: "tentative",
    studentExplanation:
      `Started from the #${tag} thread across ${titles.join(" and ")}.\n\n` +
      `Both texts touch this — but that on its own isn't a comparison. Write the specific ` +
      `similarity or difference, then support it with one piece of evidence from each text. ` +
      `The strongest version says what each writer does differently, and why that matters.`,
  });

  revalidatePath("/");
  return id;
}

export async function saveDevelopMomentAsCard(developMomentId: string, textId: string, title: string) {
  const rows = await db.select().from(developMoments).where(eq(developMoments.id, developMomentId)).limit(1);
  const moment = rows[0];
  if (!moment) throw new Error("Not found");

  const explanation = [
    `Grew out of essay work. Starting point: "${moment.essayExcerpt}"`,
    moment.studentResponse ? `Developed further: ${moment.studentResponse}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const id = await createCard({
    type: "interpretation",
    title,
    primaryTextId: textId,
    studentExplanation: explanation,
    confidence: "tentative",
    tags: ["from-essay"],
  });

  await db.update(developMoments).set({ savedAsCardId: id }).where(eq(developMoments.id, developMomentId));
  revalidatePath("/");
  return id;
}
