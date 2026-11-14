import { countByAo, weakestAo, type Ao } from "@/lib/ao";
import type { CardType } from "@/db/schema";
import { cn } from "@/lib/utils";

export function AoCoverage({
  cards,
  compact = false,
}: {
  cards: { type: CardType }[];
  compact?: boolean;
}) {
  const counts = countByAo(cards);
  const max = Math.max(1, ...counts.map((c) => c.count));
  const weakest = weakestAo(counts);

  return (
    <div className={cn("rounded-xl border border-border bg-surface", compact ? "p-4" : "p-4 md:p-5")}>
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground">Assessment objective coverage</h3>
        <span className="text-xs text-foreground-muted">{cards.length} cards</span>
      </div>

      <div className="space-y-2">
        {counts.map((c) => {
          const isWeakest = weakest?.ao === c.ao && c.count < max;
          return (
            <div key={c.ao} className="flex items-center gap-3">
              <span className={cn("text-xs font-semibold w-9 shrink-0", isWeakest ? "text-warning" : "text-foreground-muted")}>
                {c.ao}
              </span>
              <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full", isWeakest ? "bg-warning" : "bg-primary/60")}
                  style={{ width: `${Math.round((c.count / max) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-foreground-muted w-6 text-right shrink-0">{c.count}</span>
            </div>
          );
        })}
      </div>

      {!compact && (
        <>
          <p className="text-xs text-foreground-muted mt-3">
            {cards.length === 0 ? (
              "No cards yet — this fills in as you add them."
            ) : weakest && weakest.count < max ? (
              <>
                <strong className="text-foreground">{weakest.ao}</strong> is your thinnest area — {weakest.description.toLowerCase()}.
              </>
            ) : (
              "Evenly covered across the objectives."
            )}
          </p>
          <p className="text-[11px] text-foreground-muted mt-2 leading-relaxed">
            Indicative only: card counts mapped onto the general AO framework. Which AOs are weighted, and by how much,
            varies by component and isn&rsquo;t confirmed for 2028 — check the live OCR specification.
          </p>
        </>
      )}
    </div>
  );
}

export function AoChips({ cards }: { cards: { type: CardType }[] }) {
  const counts = countByAo(cards);
  const weakest = weakestAo(counts);
  const max = Math.max(1, ...counts.map((c) => c.count));

  return (
    <div className="flex flex-wrap gap-1.5">
      {counts.map((c) => {
        const isWeakest = weakest?.ao === (c.ao as Ao) && c.count < max;
        return (
          <span
            key={c.ao}
            title={c.description}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
              isWeakest ? "border-warning/40 bg-warning-bg text-warning" : "border-border bg-surface-muted text-foreground-muted"
            )}
          >
            {c.ao} <span className="font-semibold">{c.count}</span>
          </span>
        );
      })}
    </div>
  );
}
