import Link from "next/link";
import { CardTypeBadge, ConfidenceBadge } from "@/components/badges";
import type { cards } from "@/db/schema";

type CardRow = typeof cards.$inferSelect;

export function CardTile({ card, textSlug }: { card: CardRow; textSlug: string }) {
  return (
    <Link
      href={`/texts/${textSlug}/cards/${card.id}`}
      className="block rounded-lg border border-border bg-surface p-4 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <CardTypeBadge type={card.type} />
        <ConfidenceBadge confidence={card.confidence} />
      </div>
      <h4 className="font-serif font-semibold text-foreground text-sm mb-1">{card.title}</h4>
      {card.locationRef && <p className="text-xs text-foreground-muted mb-1">{card.locationRef}</p>}
      {card.quoteText && (
        <p className="text-sm italic text-foreground-muted line-clamp-2">&ldquo;{card.quoteText}&rdquo;</p>
      )}
      {!card.quoteText && card.studentExplanation && (
        <p className="text-sm text-foreground-muted line-clamp-2">{card.studentExplanation}</p>
      )}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {card.tags.map((t) => (
            <span key={t} className="text-[11px] text-foreground-muted bg-surface-muted rounded px-1.5 py-0.5">
              #{t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

/** Tag chips that navigate to the cross-text thread view. Kept separate from
 *  CardTile because nesting links inside a link isn't valid HTML. */
export function CardTags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <Link
          key={t}
          href={`/tags/${encodeURIComponent(t)}`}
          className="text-[11px] text-foreground-muted bg-surface-muted hover:bg-border/60 hover:text-foreground rounded px-1.5 py-0.5"
        >
          #{t}
        </Link>
      ))}
    </div>
  );
}
