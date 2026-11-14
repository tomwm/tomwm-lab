import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getTextBySlug,
  getCard,
  getCardLinksFor,
  getAllCardsLite,
  getCardTextIds,
  getAllTags,
  getStructureNodes,
  getCardNodeIds,
  getSectionMates,
} from "@/lib/queries";
import { db } from "@/db/client";
import { cardVersions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { type CardFormValues } from "@/components/card-form";
import { CardDetail } from "@/components/card-detail";
import { ArrowLeft } from "lucide-react";

export default async function CardDetailPage({ params }: { params: Promise<{ slug: string; cardId: string }> }) {
  const { slug, cardId } = await params;
  const text = await getTextBySlug(slug);
  if (!text) notFound();
  const card = await getCard(cardId);
  if (!card) notFound();

  const [{ outgoing, incoming }, allCardsLite, versions, cardTextIds, allTags, sectionNodes, boundNodeIds, sectionMates] =
    await Promise.all([
      getCardLinksFor(cardId),
      getAllCardsLite(),
      db.select().from(cardVersions).where(eq(cardVersions.cardId, cardId)).orderBy(desc(cardVersions.editedAt)),
      getCardTextIds(cardId),
      getAllTags(),
      getStructureNodes(card.primaryTextId ?? text.id),
      getCardNodeIds(card.id),
      getSectionMates(cardId),
    ]);

  const sections = sectionNodes
    .filter((n) => !n.isRealWorldEvent)
    .map((n) => ({ id: n.id, locationRef: n.locationRef, title: n.title }));
  const boundSections = sections.filter((s) => boundNodeIds.includes(s.id));

  // Scope link candidates to the card's OWN text(s) — not necessarily the URL's
  // text, since a comparison card can be viewed from a text it's only cross-linked to.
  const relevantTextIds = new Set([card.primaryTextId, ...cardTextIds].filter((id): id is string => !!id));
  const sameTextCandidates = allCardsLite.filter(
    (c) => c.id !== card.id && c.primaryTextId && relevantTextIds.has(c.primaryTextId)
  );
  const otherCandidates = allCardsLite.filter(
    (c) => c.id !== card.id && (!c.primaryTextId || !relevantTextIds.has(c.primaryTextId))
  );

  const formValues: CardFormValues = {
    id: card.id,
    type: card.type,
    title: card.title,
    locationRef: card.locationRef ?? "",
    quoteText: card.quoteText ?? "",
    speakerOrNarrator: card.speakerOrNarrator ?? "",
    studentExplanation: card.studentExplanation ?? "",
    sourceNote: card.sourceNote ?? "",
    confidence: card.confidence,
    tags: card.tags.join(", "),
    structureNodeIds: boundNodeIds,
  };

  const existingLinks = [
    ...outgoing.map((o) => ({
      id: o.link.id,
      relation: o.link.relation,
      explanation: o.link.explanation,
      other: { id: o.other.id, title: o.other.title },
      direction: "outgoing" as const,
    })),
    ...incoming.map((i) => ({
      id: i.link.id,
      relation: i.link.relation,
      explanation: i.link.explanation,
      other: { id: i.other.id, title: i.other.title },
      direction: "incoming" as const,
    })),
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href={`/texts/${slug}`} className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-primary">
        <ArrowLeft className="size-4" /> Back to {text.title}
      </Link>

      <CardDetail
        card={card}
        textSlug={slug}
        formValues={formValues}
        sections={sections}
        boundSections={boundSections}
        existingTags={allTags.map((t) => ({ tag: t.tag, count: t.count }))}
        sameTextCandidates={sameTextCandidates}
        otherCandidates={otherCandidates}
        existingLinks={existingLinks}
        sectionMates={sectionMates}
        versions={versions.map((v) => ({ id: v.id, editedAt: v.editedAt, editSummary: v.editSummary }))}
      />
    </div>
  );
}
