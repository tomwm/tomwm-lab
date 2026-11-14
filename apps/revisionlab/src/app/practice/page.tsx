import Link from "next/link";
import {
  getDueReviews,
  getTextById,
  getTextBySlug,
  getTexts,
  getStructureNodes,
  getAllTags,
  getPreviousResponses,
} from "@/lib/queries";
import { PracticeSession, type PracticeItem } from "@/components/practice-session";
import { PracticeFilters } from "@/components/practice-filters";
import { generatePromptsForCard } from "@/lib/practice";
import { CARD_TYPES } from "@/db/schema";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ text?: string; type?: string; tag?: string; from?: string; to?: string; all?: string }>;
}) {
  const params = await searchParams;

  const allTexts = await getTexts();
  const selectedText = params.text ? await getTextBySlug(params.text) : null;

  const [sections, tags] = await Promise.all([
    selectedText ? getStructureNodes(selectedText.id) : Promise.resolve([]),
    getAllTags(),
  ]);

  const filters = {
    textId: selectedText?.id,
    cardType: params.type,
    tag: params.tag,
    fromOrderIndex: params.from ? Number(params.from) : undefined,
    toOrderIndex: params.to ? Number(params.to) : undefined,
    includeNotDue: params.all === "1",
    limit: 20,
  };

  const due = await getDueReviews(filters);
  // If nothing is due, find out whether there's anything to practise anyway —
  // sitting down to revise a topic shouldn't be blocked by a scheduler.
  const availableIfNotDue =
    due.length === 0 && !filters.includeNotDue
      ? (await getDueReviews({ ...filters, includeNotDue: true, limit: 5000 })).length
      : 0;

  const textsById = new Map<string, Awaited<ReturnType<typeof getTextById>>>();
  for (const d of due) {
    if (!d.card.primaryTextId || textsById.has(d.card.primaryTextId)) continue;
    textsById.set(d.card.primaryTextId, await getTextById(d.card.primaryTextId));
  }

  const priorResponses = await getPreviousResponses(due.map((d) => d.review.id));

  const items: PracticeItem[] = due.map((d) => {
    // The question is regenerated from the card rather than stored, so it stays
    // in step if the card is retitled or its location reference changes.
    const prompt = generatePromptsForCard({
      type: d.card.type,
      title: d.card.title,
      locationRef: d.card.locationRef,
      speakerOrNarrator: d.card.speakerOrNarrator,
      hasQuote: !!d.card.quoteText,
    }).find((p) => p.promptType === d.review.promptType);

    return {
      reviewStateId: d.review.id,
      promptType: d.review.promptType,
      // A review row whose prompt no longer generates (the quotation was removed,
      // say) falls back to produce: without a matching prompt there is certainly
      // no checkable answer, so never claim one.
      mode: prompt?.mode ?? "produce",
      question: prompt?.question ?? null,
      cardTitle: d.card.title,
      cardType: d.card.type,
      locationRef: d.card.locationRef,
      speakerOrNarrator: d.card.speakerOrNarrator,
      quoteText: d.card.quoteText,
      studentExplanation: d.card.studentExplanation,
      textTitle: d.card.primaryTextId ? textsById.get(d.card.primaryTextId)?.title ?? null : null,
      previousAttempts: (priorResponses.get(d.review.id) ?? []).map((p) => ({
        text: p.text,
        reviewedAt: p.reviewedAt,
      })),
    };
  });

  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null) as [string, string][]
  );
  const filterKey = query.toString();
  const queryWithAll = new URLSearchParams(query);
  queryWithAll.set("all", "1");

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">Practice</h1>
        <p className="text-sm text-foreground-muted">
          Two kinds of prompt come up here. Quotations have a right answer, so you write them out
          and check. Everything else doesn&rsquo;t — there you write an answer and compare it with
          the one you gave last time. Reading a card doesn&rsquo;t count as knowing it.
        </p>
      </div>

      <PracticeFilters
        texts={allTexts.map((t) => ({ value: t.slug, label: t.title }))}
        sections={sections
          .filter((s) => !s.isRealWorldEvent)
          .map((s) => ({ value: String(s.orderIndex), label: `${s.locationRef} — ${s.title}` }))}
        types={[...CARD_TYPES]}
        tags={tags.map((t) => ({ value: t.tag, label: `#${t.tag} (${t.count})` }))}
      />

      {items.length === 0 && availableIfNotDue > 0 ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-foreground font-medium mb-1">Nothing due here right now.</p>
          <p className="text-sm text-foreground-muted mb-4">
            {availableIfNotDue} prompt{availableIfNotDue === 1 ? "" : "s"} match your filters but aren&rsquo;t scheduled yet.
          </p>
          <Link href={`/practice?${queryWithAll.toString()}`} className="text-sm text-primary hover:underline">
            Practise them anyway →
          </Link>
        </div>
      ) : (
        /* Keyed on the filters so changing them starts a fresh queue — the
           session itself deliberately holds its queue steady once mounted. */
        <PracticeSession key={filterKey} items={items} aheadOfSchedule={filters.includeNotDue} />
      )}
    </div>
  );
}
