"use client";
import { useState } from "react";
import Link from "next/link";
import { CardForm, type CardFormValues, type SectionOption } from "@/components/card-form";
import { CardTags } from "@/components/card-tile";
import { LinkEditor, type LiteCard } from "@/components/link-editor";
import { CardTypeBadge, ConfidenceBadge, ProvenanceBadge } from "@/components/badges";
import { DeleteCardButton } from "@/components/delete-card-button";
import { Button } from "@/components/ui/button";
import { CARD_TYPE_LABELS, friendlyDate } from "@/lib/utils";
import { Pencil, History } from "lucide-react";
import type { cards as cardsTable } from "@/db/schema";

type CardRow = typeof cardsTable.$inferSelect;

export function CardDetail({
  card,
  textSlug,
  formValues,
  sections,
  boundSections,
  existingTags,
  sameTextCandidates,
  otherCandidates,
  existingLinks,
  sectionMates,
  versions,
}: {
  card: CardRow;
  textSlug: string;
  formValues: CardFormValues;
  sections: SectionOption[];
  boundSections: SectionOption[];
  existingTags: { tag: string; count: number }[];
  sameTextCandidates: LiteCard[];
  otherCandidates: LiteCard[];
  existingLinks: {
    id: string;
    relation: string;
    explanation: string | null;
    other: { id: string; title: string };
    direction: "outgoing" | "incoming";
  }[];
  sectionMates: { card: CardRow; sections: string[] }[];
  versions: { id: string; editedAt: number; editSummary: string | null }[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTypeBadge type={card.type} />
          <ConfidenceBadge confidence={card.confidence} />
          <ProvenanceBadge provenance={card.provenance} />
        </div>
        {!editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4" /> Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-6">
          <CardForm
            textId={card.primaryTextId ?? ""}
            textSlug={textSlug}
            initial={formValues}
            sections={sections}
            existingTags={existingTags}
            onSaved={() => setEditing(false)}
          />
          <div className="border-t border-border pt-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Connections</h2>
            <LinkEditor
              cardId={card.id}
              sameTextCandidates={sameTextCandidates}
              otherCandidates={otherCandidates}
              existing={existingLinks}
            />
          </div>

          {/* Destructive actions belong with editing, not on a page she's
              reading during revision. */}
          <div className="border-t border-border pt-5">
            <DeleteCardButton cardId={card.id} textSlug={textSlug} />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">{card.title}</h1>
            {card.locationRef && <p className="text-sm text-foreground-muted mt-0.5">{card.locationRef}</p>}
          </div>

          {/* A quotation should read as a quotation, not sit in a form field. */}
          {card.quoteText && (
            <blockquote className="border-l-2 border-primary/40 pl-4">
              <p className="font-serif text-lg italic text-foreground leading-relaxed">
                &ldquo;{card.quoteText}&rdquo;
              </p>
              {card.speakerOrNarrator && (
                <footer className="text-sm text-foreground-muted mt-1">— {card.speakerOrNarrator}</footer>
              )}
            </blockquote>
          )}

          {card.studentExplanation && (
            <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap max-w-2xl">
              {card.studentExplanation}
            </p>
          )}

          {card.sourceNote && (
            <p className="text-sm text-foreground-muted max-w-2xl">
              <span className="font-medium">Source:</span> {card.sourceNote}
            </p>
          )}

          {boundSections.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground-muted mb-1.5">Where in the text</p>
              <div className="flex flex-wrap gap-1.5">
                {boundSections.map((sec) => (
                  <Link
                    key={sec.id}
                    href={`/texts/${textSlug}/sections/${sec.id}`}
                    title={sec.title}
                    className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs text-foreground-muted hover:border-primary/40 hover:text-foreground"
                  >
                    {sec.locationRef}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {card.tags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground-muted mb-1.5">
                Tags — follow one to see the same idea in your other texts
              </p>
              <CardTags tags={card.tags} />
            </div>
          )}
        </div>
      )}

      {!editing && (
        <div className="border-t border-border pt-6">
          <h2 className="text-sm font-semibold text-foreground mb-1">Connections</h2>
          <p className="text-xs text-foreground-muted mb-3">
            Relationships you&rsquo;ve drawn between this card and others.
          </p>
          <LinkEditor
            cardId={card.id}
            sameTextCandidates={sameTextCandidates}
            otherCandidates={otherCandidates}
            existing={existingLinks}
            readOnly
          />
        </div>
      )}

      {sectionMates.length > 0 && (
        <div className="border-t border-border pt-6">
          <h2 className="text-sm font-semibold text-foreground mb-1">Also in the same sections</h2>
          <p className="text-xs text-foreground-muted mb-3">
            Cards that happen to sit at the same points in the text. Not connections you&rsquo;ve made — just
            neighbours, in case one is worth linking.
          </p>
          <ul className="space-y-1.5">
            {sectionMates.map(({ card: mate, sections: shared }) => (
              <li key={mate.id} className="text-sm flex flex-wrap items-baseline gap-x-2">
                <Link
                  href={`/texts/${textSlug}/cards/${mate.id}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {mate.title}
                </Link>
                <span className="text-xs text-foreground-muted">
                  {CARD_TYPE_LABELS[mate.type] ?? mate.type} · {shared.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {versions.length > 0 && (
        <details className="border-t border-border pt-6">
          <summary className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
            <History className="size-4" /> Edit history ({versions.length})
          </summary>
          <ul className="space-y-1 text-sm text-foreground-muted mt-3">
            {versions.map((v) => (
              <li key={v.id}>
                Edited {friendlyDate(v.editedAt)}
                {v.editSummary ? ` — ${v.editSummary}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
