"use client";
import { useState } from "react";
import { CardTile } from "@/components/card-tile";
import { CARD_TYPE_LABELS, cn } from "@/lib/utils";
import type { cards, CardType } from "@/db/schema";

type CardRow = typeof cards.$inferSelect;

export function CardFilterGrid({
  cards: allCards,
  types,
  textSlug,
}: {
  cards: CardRow[];
  types: CardType[];
  textSlug: string;
}) {
  const [active, setActive] = useState<CardType | "all">("all");

  // This grid is always scoped to its tab's card types. "All" means all of
  // *these* types — not every card in the text, which is what the tab headings
  // promise and what the counts below make explicit.
  const inScope = allCards.filter((c) => types.includes(c.type));
  const visible = active === "all" ? inScope : inScope.filter((c) => c.type === active);

  return (
    <div>
      {types.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <FilterChip active={active === "all"} onClick={() => setActive("all")}>
            All ({inScope.length})
          </FilterChip>
          {types.map((t) => {
            const count = inScope.filter((c) => c.type === t).length;
            return (
              <FilterChip key={t} active={active === t} onClick={() => setActive(t)}>
                {CARD_TYPE_LABELS[t]} ({count})
              </FilterChip>
            );
          })}
        </div>
      )}
      {visible.length === 0 ? (
        <p className="text-sm text-foreground-muted py-8 text-center">No cards here yet — add one to get started.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <CardTile key={c.id} card={c} textSlug={textSlug} />
          ))}
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
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-foreground-muted hover:border-primary/40"
      )}
    >
      {children}
    </button>
  );
}
