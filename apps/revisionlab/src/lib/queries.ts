import "server-only";
import { db } from "@/db/client";
import {
  texts,
  structureNodes,
  cards,
  cardTexts,
  cardLinks,
  reviewStates,
  reviewLog,
  essays,
  essayFeedback,
  developMoments,
  cardStructureNodes,
} from "@/db/schema";
import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";

export async function getTexts() {
  return db.select().from(texts).orderBy(asc(texts.createdAt));
}

export async function getTextBySlug(slug: string) {
  const rows = await db.select().from(texts).where(eq(texts.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getTextById(id: string) {
  const rows = await db.select().from(texts).where(eq(texts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getStructureNodes(textId: string) {
  return db
    .select()
    .from(structureNodes)
    .where(eq(structureNodes.textId, textId))
    .orderBy(asc(structureNodes.orderIndex));
}

export interface CardFilters {
  types?: string[];
  tag?: string;
}

export async function getCardsForText(textId: string, filters: CardFilters = {}) {
  // Cards primarily on this text, plus multi-text cards (comparisons) linked via cardTexts.
  const direct = db.select().from(cards).where(eq(cards.primaryTextId, textId));
  const viaJoin = db
    .select({ card: cards })
    .from(cardTexts)
    .innerJoin(cards, eq(cardTexts.cardId, cards.id))
    .where(eq(cardTexts.textId, textId));

  const [directRows, joinRows] = await Promise.all([direct, viaJoin]);
  const map = new Map<string, (typeof directRows)[number]>();
  for (const c of directRows) map.set(c.id, c);
  for (const r of joinRows) map.set(r.card.id, r.card);

  let result = Array.from(map.values());
  if (filters.types?.length) result = result.filter((c) => filters.types!.includes(c.type));
  if (filters.tag) result = result.filter((c) => c.tags.includes(filters.tag!));
  result.sort((a, b) => b.updatedAt - a.updatedAt);
  return result;
}


export async function getCard(id: string) {
  const rows = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getCardTextIds(cardId: string) {
  const rows = await db.select().from(cardTexts).where(eq(cardTexts.cardId, cardId));
  return rows.map((r) => r.textId);
}

export async function getCardLinksFor(cardId: string) {
  const outgoing = await db
    .select({ link: cardLinks, other: cards })
    .from(cardLinks)
    .innerJoin(cards, eq(cardLinks.toCardId, cards.id))
    .where(eq(cardLinks.fromCardId, cardId));
  const incoming = await db
    .select({ link: cardLinks, other: cards })
    .from(cardLinks)
    .innerJoin(cards, eq(cardLinks.fromCardId, cards.id))
    .where(eq(cardLinks.toCardId, cardId));
  return { outgoing, incoming };
}

export async function getAllCardsLite() {
  return db
    .select({
      id: cards.id,
      title: cards.title,
      type: cards.type,
      primaryTextId: cards.primaryTextId,
      textTitle: texts.title,
    })
    .from(cards)
    .leftJoin(texts, eq(cards.primaryTextId, texts.id))
    .orderBy(asc(cards.title));
}

export interface PracticeFilters {
  textId?: string;
  cardType?: string;
  tag?: string;
  /** Inclusive structure-node order range, e.g. just Act 3. */
  fromOrderIndex?: number;
  toOrderIndex?: number;
  /** Practise material that isn't due yet — for revising a topic on demand. */
  includeNotDue?: boolean;
  limit?: number;
}

export async function getDueReviews(filters: PracticeFilters = {}) {
  const now = Date.now();
  const { limit = 20 } = filters;

  const base = db
    .select({ review: reviewStates, card: cards })
    .from(reviewStates)
    .innerJoin(cards, eq(reviewStates.cardId, cards.id))
    .orderBy(asc(reviewStates.dueAt));

  const rows = filters.includeNotDue
    ? await base.limit(1000)
    : await db
        .select({ review: reviewStates, card: cards })
        .from(reviewStates)
        .innerJoin(cards, eq(reviewStates.cardId, cards.id))
        .where(lte(reviewStates.dueAt, now))
        .orderBy(asc(reviewStates.dueAt))
        .limit(1000);

  let filtered = rows;

  if (filters.textId) filtered = filtered.filter((r) => r.card.primaryTextId === filters.textId);
  if (filters.cardType) filtered = filtered.filter((r) => r.card.type === filters.cardType);
  if (filters.tag) filtered = filtered.filter((r) => (r.card.tags ?? []).includes(filters.tag!));

  // Section range: a card matches if ANY section it's bound to falls in range.
  // Cards bound to no section (context, most comparisons) are excluded — she
  // asked for a stretch of the text, and they don't sit in one.
  if (filters.fromOrderIndex != null || filters.toOrderIndex != null) {
    const cardIds = filtered.map((r) => r.card.id);
    const bindings = cardIds.length
      ? await db
          .select({ cardId: cardStructureNodes.cardId, orderIndex: structureNodes.orderIndex })
          .from(cardStructureNodes)
          .innerJoin(structureNodes, eq(cardStructureNodes.structureNodeId, structureNodes.id))
          .where(inArray(cardStructureNodes.cardId, cardIds))
      : [];
    const from = filters.fromOrderIndex ?? -Infinity;
    const to = filters.toOrderIndex ?? Infinity;
    const inRange = new Set(
      bindings.filter((b) => b.orderIndex >= from && b.orderIndex <= to).map((b) => b.cardId)
    );
    filtered = filtered.filter((r) => inRange.has(r.card.id));
  }

  return filtered.slice(0, limit);
}

export async function countDueReviews(textId?: string) {
  const rows = await getDueReviews({ textId, limit: 5000 });
  return rows.length;
}

/**
 * What she wrote the last few times she met these prompts.
 *
 * For prompts with no checkable answer this is the only honest comparison point
 * available offline — and arguably a better one than a model answer, which
 * would invite her to converge on someone else's reading. Seeing her own earlier
 * paragraph asks the question that matters: did I get further this time?
 *
 * Empty responses are skipped: a blank attempt tells her nothing.
 */
export async function getPreviousResponses(reviewStateIds: string[], perState = 3) {
  if (reviewStateIds.length === 0) return new Map<string, PreviousResponse[]>();

  const rows = await db
    .select()
    .from(reviewLog)
    .where(inArray(reviewLog.reviewStateId, reviewStateIds))
    .orderBy(desc(reviewLog.reviewedAt));

  const byState = new Map<string, PreviousResponse[]>();
  for (const row of rows) {
    const text = row.responseText?.trim();
    if (!text) continue;
    const list = byState.get(row.reviewStateId) ?? [];
    if (list.length >= perState) continue;
    list.push({ text, reviewedAt: row.reviewedAt, result: row.result });
    byState.set(row.reviewStateId, list);
  }
  return byState;
}

export interface PreviousResponse {
  text: string;
  reviewedAt: number;
  result: string;
}

export async function getEssays() {
  return db.select().from(essays).orderBy(desc(essays.createdAt));
}

export async function getEssay(id: string) {
  const rows = await db.select().from(essays).where(eq(essays.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getEssayChain(rootOrAnyId: string) {
  // Walk to root, then collect the full chain in order.
  let current = await getEssay(rootOrAnyId);
  if (!current) return [];
  while (current.parentEssayId) {
    const parent = await getEssay(current.parentEssayId);
    if (!parent) break;
    current = parent;
  }
  const chain = [current];
  let cursor = current;
  // find children iteratively
  for (;;) {
    const child = await db.select().from(essays).where(eq(essays.parentEssayId, cursor.id)).limit(1);
    if (!child[0]) break;
    chain.push(child[0]);
    cursor = child[0];
  }
  return chain;
}

export async function getFeedbackForEssay(essayId: string) {
  return db.select().from(essayFeedback).where(eq(essayFeedback.essayId, essayId)).orderBy(desc(essayFeedback.createdAt));
}

export async function getDevelopMomentsForFeedback(essayFeedbackId: string) {
  return db.select().from(developMoments).where(eq(developMoments.essayFeedbackId, essayFeedbackId));
}

export async function getCardLinksForText(textId: string) {
  const textCards = await getCardsForText(textId);
  const idSet = new Set(textCards.map((c) => c.id));
  if (!idSet.size) return [];

  const [allLinks, allCards] = await Promise.all([db.select().from(cardLinks), db.select().from(cards)]);
  const cardById = new Map(allCards.map((c) => [c.id, c]));

  const relevant = allLinks.filter((l) => idSet.has(l.fromCardId) || idSet.has(l.toCardId));
  return relevant
    .map((link) => ({ link, from: cardById.get(link.fromCardId), to: cardById.get(link.toCardId) }))
    .filter((r): r is { link: (typeof allLinks)[number]; from: NonNullable<typeof r.from>; to: NonNullable<typeof r.to> } => !!r.from && !!r.to);
}

// ─── Timeline / character presence ─────────────────────────────────────────

export async function getCharacterPresence(textId: string) {
  // The presence grid is just the card/section bindings restricted to
  // character cards — same mechanism every other card type now uses.
  const rows = await db
    .select({ nodeId: cardStructureNodes.structureNodeId, cardId: cardStructureNodes.cardId })
    .from(cardStructureNodes)
    .innerJoin(structureNodes, eq(cardStructureNodes.structureNodeId, structureNodes.id))
    .innerJoin(cards, eq(cardStructureNodes.cardId, cards.id))
    .where(and(eq(structureNodes.textId, textId), eq(cards.type, "character")));
  return rows;
}

/** Every card/section binding for a text, for counting cards per section. */
export async function getCardNodeBindings(textId: string) {
  return db
    .select({
      nodeId: cardStructureNodes.structureNodeId,
      cardId: cardStructureNodes.cardId,
      cardType: cards.type,
      cardTitle: cards.title,
    })
    .from(cardStructureNodes)
    .innerJoin(structureNodes, eq(cardStructureNodes.structureNodeId, structureNodes.id))
    .innerJoin(cards, eq(cardStructureNodes.cardId, cards.id))
    .where(eq(structureNodes.textId, textId));
}

/** Other cards bound to the same section(s) as this one — incidental
 *  neighbours rather than relationships she's drawn, so shown as secondary. */
export async function getSectionMates(cardId: string) {
  const nodeIds = await getCardNodeIds(cardId);
  if (!nodeIds.length) return [];

  const rows = await db
    .select({ card: cards, locationRef: structureNodes.locationRef, nodeId: structureNodes.id })
    .from(cardStructureNodes)
    .innerJoin(cards, eq(cardStructureNodes.cardId, cards.id))
    .innerJoin(structureNodes, eq(cardStructureNodes.structureNodeId, structureNodes.id))
    .where(inArray(cardStructureNodes.structureNodeId, nodeIds));

  const byCard = new Map<string, { card: (typeof rows)[number]["card"]; sections: string[] }>();
  for (const r of rows) {
    if (r.card.id === cardId) continue;
    const entry = byCard.get(r.card.id) ?? { card: r.card, sections: [] };
    if (!entry.sections.includes(r.locationRef)) entry.sections.push(r.locationRef);
    byCard.set(r.card.id, entry);
  }
  return Array.from(byCard.values()).sort((a, b) => a.card.title.localeCompare(b.card.title));
}

export async function getStructureNode(id: string) {
  const rows = await db.select().from(structureNodes).where(eq(structureNodes.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Every card bound to one section, newest edits first. */
export async function getCardsForNode(nodeId: string) {
  const rows = await db
    .select({ card: cards })
    .from(cardStructureNodes)
    .innerJoin(cards, eq(cardStructureNodes.cardId, cards.id))
    .where(eq(cardStructureNodes.structureNodeId, nodeId));
  return rows.map((r) => r.card).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Which sections a single card is bound to. */
export async function getCardNodeIds(cardId: string) {
  const rows = await db
    .select({ structureNodeId: cardStructureNodes.structureNodeId })
    .from(cardStructureNodes)
    .where(eq(cardStructureNodes.cardId, cardId));
  return rows.map((r) => r.structureNodeId);
}

export async function getCharacterCards(textId: string) {
  return db
    .select()
    .from(cards)
    .where(and(eq(cards.primaryTextId, textId), eq(cards.type, "character")))
    .orderBy(asc(cards.title));
}

// ─── Tags (cross-text themes) ──────────────────────────────────────────────

export async function getAllTags() {
  const rows = await db
    .select({ tags: cards.tags, primaryTextId: cards.primaryTextId, textTitle: texts.title })
    .from(cards)
    .leftJoin(texts, eq(cards.primaryTextId, texts.id));

  const byTag = new Map<string, { tag: string; count: number; textTitles: Set<string> }>();
  for (const row of rows) {
    for (const tag of row.tags ?? []) {
      const entry = byTag.get(tag) ?? { tag, count: 0, textTitles: new Set<string>() };
      entry.count += 1;
      if (row.textTitle) entry.textTitles.add(row.textTitle);
      byTag.set(tag, entry);
    }
  }
  return Array.from(byTag.values())
    .map((e) => ({ tag: e.tag, count: e.count, textTitles: Array.from(e.textTitles).sort() }))
    .sort((a, b) => b.textTitles.length - a.textTitles.length || b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getCardsByTag(tag: string) {
  const rows = await db
    .select({ card: cards, textTitle: texts.title, textSlug: texts.slug, textAccentKey: texts.accentKey })
    .from(cards)
    .leftJoin(texts, eq(cards.primaryTextId, texts.id))
    .orderBy(asc(texts.title), asc(cards.title));
  return rows.filter((r) => (r.card.tags ?? []).includes(tag));
}

export async function getCardsNeedingChecking() {
  return db
    .select({
      card: cards,
      textSlug: texts.slug,
      textTitle: texts.title,
      textAccentKey: texts.accentKey,
    })
    .from(cards)
    .leftJoin(texts, eq(cards.primaryTextId, texts.id))
    .where(eq(cards.confidence, "needs_checking"))
    .orderBy(asc(texts.title), asc(cards.title));
}

/** What deleting a text would destroy — so the confirmation can say so. */
export async function getTextDeletionImpact(textId: string) {
  const [ownedCards, sections] = await Promise.all([
    db.select({ id: cards.id }).from(cards).where(eq(cards.primaryTextId, textId)),
    db.select({ id: structureNodes.id }).from(structureNodes).where(eq(structureNodes.textId, textId)),
  ]);
  return { cards: ownedCards.length, sections: sections.length };
}

export async function getTextsByIds(ids: string[]) {
  if (!ids.length) return [];
  return db.select().from(texts).where(inArray(texts.id, ids));
}
