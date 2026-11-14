import { NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  texts,
  structureNodes,
  cards,
  cardTexts,
  cardStructureNodes,
  cardVersions,
  cardLinks,
  reviewStates,
  reviewLog,
  essays,
  essayFeedback,
  developMoments,
} from "@/db/schema";

export async function GET() {
  const [
    textsRows,
    structureNodesRows,
    cardsRows,
    cardTextsRows,
    cardStructureNodesRows,
    cardVersionsRows,
    cardLinksRows,
    reviewStatesRows,
    reviewLogRows,
    essaysRows,
    essayFeedbackRows,
    developMomentsRows,
  ] = await Promise.all([
    db.select().from(texts),
    db.select().from(structureNodes),
    db.select().from(cards),
    db.select().from(cardTexts),
    db.select().from(cardStructureNodes),
    db.select().from(cardVersions),
    db.select().from(cardLinks),
    db.select().from(reviewStates),
    db.select().from(reviewLog),
    db.select().from(essays),
    db.select().from(essayFeedback),
    db.select().from(developMoments),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    texts: textsRows,
    structureNodes: structureNodesRows,
    cards: cardsRows,
    cardTexts: cardTextsRows,
    cardStructureNodes: cardStructureNodesRows,
    cardVersions: cardVersionsRows,
    cardLinks: cardLinksRows,
    reviewStates: reviewStatesRows,
    reviewLog: reviewLogRows,
    essays: essaysRows,
    essayFeedback: essayFeedbackRows,
    developMoments: developMomentsRows,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="revisionlab-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
