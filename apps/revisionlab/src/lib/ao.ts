import type { CardType } from "@/db/schema";

// Indicative mapping of card types onto the A-level English Literature
// assessment objectives. This is a revision-planning aid, NOT a mark scheme:
// which AOs are weighted, and by how much, varies by component and has not
// been confirmed for the 2028 series. Verify against the live OCR H472
// specification before treating any of this as authoritative.

export const AOS = ["AO1", "AO2", "AO3", "AO4", "AO5"] as const;
export type Ao = (typeof AOS)[number];

export const AO_DESCRIPTIONS: Record<Ao, string> = {
  AO1: "Informed personal response, using appropriate concepts and terminology",
  AO2: "Analyse how meanings are shaped — language, form and structure",
  AO3: "The significance of the contexts texts are written and received in",
  AO4: "Explore connections across texts",
  AO5: "Explore texts informed by different interpretations",
};

// A card type can serve more than one AO. The first listed is its primary use.
export const CARD_TYPE_AOS: Record<CardType, Ao[]> = {
  evidence: ["AO2", "AO1"],
  method: ["AO2"],
  theme: ["AO1"],
  character: ["AO1"],
  context: ["AO3"],
  interpretation: ["AO5", "AO1"],
  comparison: ["AO4"],
  performance: ["AO5", "AO3"],
};

export interface AoCount {
  ao: Ao;
  count: number;
  description: string;
}

/** Counts cards against each AO, crediting a card to every AO it serves. */
export function countByAo(cards: { type: CardType }[]): AoCount[] {
  const counts = Object.fromEntries(AOS.map((a) => [a, 0])) as Record<Ao, number>;
  for (const card of cards) {
    for (const ao of CARD_TYPE_AOS[card.type] ?? []) counts[ao] += 1;
  }
  return AOS.map((ao) => ({ ao, count: counts[ao], description: AO_DESCRIPTIONS[ao] }));
}

/** The AO with the fewest cards — the one worth attention next. */
export function weakestAo(counts: AoCount[]): AoCount | null {
  if (!counts.length) return null;
  return counts.reduce((min, c) => (c.count < min.count ? c : min), counts[0]);
}
