"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CARD_TYPE_LABELS, RELATION_LABELS, cn } from "@/lib/utils";
import { RELATIONS, type Relation } from "@/db/schema";
import { Link2Off } from "lucide-react";

interface LiteCard {
  id: string;
  title: string;
  type: string;
}

export interface ConnectionRow {
  id: string;
  relation: string;
  explanation: string | null;
  fromId: string;
  fromTitle: string;
  toId: string;
  toTitle: string;
}

// A link reads differently depending on which end you're standing at, so the
// hub view phrases inbound edges in the passive.
const INVERSE_RELATION_LABELS: Record<string, string> = {
  supports: "is supported by",
  challenges: "is challenged by",
  contrasts_with: "contrasts with",
  develops: "is developed by",
  foreshadows: "is foreshadowed by",
  provides_context_for: "gets context from",
};

export function ConnectionsView({
  cards,
  connections,
  textSlug,
}: {
  cards: LiteCard[];
  connections: ConnectionRow[];
  textSlug: string;
}) {
  const [relationFilter, setRelationFilter] = useState<Relation | "all">("all");

  const visible = relationFilter === "all" ? connections : connections.filter((c) => c.relation === relationFilter);

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  // Every link is listed under both of its endpoints — an interpretation that
  // lots of evidence points at is a hub even though it's never the "from" card.
  const hubs = useMemo(() => {
    const byCard = new Map<string, { card: LiteCard; entries: { row: ConnectionRow; outgoing: boolean }[] }>();
    for (const row of visible) {
      for (const [cardId, outgoing] of [
        [row.fromId, true],
        [row.toId, false],
      ] as [string, boolean][]) {
        const card = cardById.get(cardId);
        if (!card) continue;
        const entry = byCard.get(cardId) ?? { card, entries: [] };
        entry.entries.push({ row, outgoing });
        byCard.set(cardId, entry);
      }
    }
    return Array.from(byCard.values()).sort(
      (a, b) => b.entries.length - a.entries.length || a.card.title.localeCompare(b.card.title)
    );
  }, [visible, cardById]);

  const connectedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of connections) {
      ids.add(c.fromId);
      ids.add(c.toId);
    }
    return ids;
  }, [connections]);

  const orphans = cards.filter((c) => !connectedIds.has(c.id));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-foreground-muted mb-3">
          <strong className="text-foreground">{connectedIds.size}</strong> of {cards.length} cards are connected to
          something.
          {orphans.length > 0 && ` ${orphans.length} aren't yet.`}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={relationFilter === "all"} onClick={() => setRelationFilter("all")}>
            All ({connections.length})
          </FilterChip>
          {RELATIONS.map((r) => {
            const count = connections.filter((c) => c.relation === r).length;
            if (count === 0) return null;
            return (
              <FilterChip key={r} active={relationFilter === r} onClick={() => setRelationFilter(r)}>
                {RELATION_LABELS[r]} ({count})
              </FilterChip>
            );
          })}
        </div>
      </div>

      {hubs.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          No connections of this kind yet. Open a card and link it to another to start mapping how your ideas relate.
        </p>
      ) : (
        <div className="space-y-4">
          {hubs.map(({ card, entries }) => (
            <div key={card.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <Link
                  href={`/texts/${textSlug}/cards/${card.id}`}
                  className="font-serif font-semibold text-sm text-foreground hover:text-primary"
                >
                  {card.title}
                </Link>
                <div className="flex items-center gap-2">
                  <Badge>{CARD_TYPE_LABELS[card.type] ?? card.type}</Badge>
                  <span className="text-xs text-foreground-muted">
                    {entries.length} connection{entries.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <ul className="space-y-2">
                {entries.map(({ row, outgoing }) => (
                  <li key={`${row.id}-${outgoing ? "out" : "in"}`} className="text-sm border-l-2 border-border pl-3">
                    <p>
                      <span className="text-foreground-muted">
                        {outgoing ? RELATION_LABELS[row.relation] : INVERSE_RELATION_LABELS[row.relation] ?? RELATION_LABELS[row.relation]}
                      </span>{" "}
                      <Link
                        href={`/texts/${textSlug}/cards/${outgoing ? row.toId : row.fromId}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {outgoing ? row.toTitle : row.fromTitle}
                      </Link>
                    </p>
                    {row.explanation && <p className="text-foreground-muted mt-0.5">{row.explanation}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {orphans.length > 0 && (
        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-1">
            <Link2Off className="size-4 text-foreground-muted" /> Not yet connected ({orphans.length})
          </h3>
          <p className="text-xs text-foreground-muted mb-3 max-w-xl">
            A card with no connections is an idea you haven&rsquo;t tested against anything else yet — a quotation with
            nothing to support, or a theme nothing feeds into. Open one and link it to something.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {orphans.map((c) => (
              <Link
                key={c.id}
                href={`/texts/${textSlug}/cards/${c.id}`}
                title={CARD_TYPE_LABELS[c.type] ?? c.type}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-surface px-2.5 py-1 text-xs text-foreground-muted hover:border-primary/40 hover:text-foreground"
              >
                {c.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground-muted hover:border-primary/40"
      )}
    >
      {children}
    </button>
  );
}
