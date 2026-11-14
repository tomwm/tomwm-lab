import Link from "next/link";
import { getCardsNeedingChecking } from "@/lib/queries";
import { CardTypeBadge } from "@/components/badges";
import { MarkCheckedButton } from "@/components/mark-checked-button";
import { ACCENT_COLORS } from "@/lib/utils";
import { ShieldCheck, ArrowUpRight } from "lucide-react";

export default async function NeedsCheckingPage() {
  const rows = await getCardsNeedingChecking();

  // Group by text — when scanning a to-do list across the whole app, "which
  // book" is the useful thing to see at a glance, not "which card type".
  const groups: {
    key: string;
    textTitle: string | null;
    textSlug: string | null;
    textAccentKey: string | null;
    items: typeof rows;
  }[] = [];
  for (const row of rows) {
    const key = row.textSlug ?? "unassigned";
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, textTitle: row.textTitle, textSlug: row.textSlug, textAccentKey: row.textAccentKey, items: [] };
      groups.push(group);
    }
    group.items.push(row);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">Needs checking</h1>
        <p className="text-sm text-foreground-muted">
          Cards flagged because something specific is unverified — an exact quotation, a citation, a fact you weren&rsquo;t
          sure of. Fix it, then mark it checked; it&rsquo;ll drop off this list.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <ShieldCheck className="size-8 text-success mx-auto mb-3" />
          <p className="text-foreground font-medium">Nothing needs checking right now.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-2 mb-3">
                <span className="size-2.5 rounded-full shrink-0" style={{ background: ACCENT_COLORS[group.textAccentKey ?? "info"] }} />
                <h2 className="font-serif text-lg font-semibold text-foreground">{group.textTitle ?? "No text"}</h2>
                <span className="text-xs text-foreground-muted">
                  {group.items.length} card{group.items.length === 1 ? "" : "s"}
                </span>
              </div>

              <ul className="space-y-3">
                {group.items.map(({ card, textSlug }) => (
                  <li key={card.id} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex flex-wrap items-center gap-2 min-w-0 text-xs text-foreground-muted">
                        <CardTypeBadge type={card.type} />
                        {card.locationRef && <span>{card.locationRef}</span>}
                      </div>
                      {textSlug && (
                        <Link
                          href={`/texts/${textSlug}/cards/${card.id}`}
                          className="inline-flex items-center gap-0.5 text-sm text-primary hover:underline shrink-0"
                        >
                          Open <ArrowUpRight className="size-3.5" />
                        </Link>
                      )}
                    </div>

                    <p className="font-serif font-semibold text-sm text-foreground">{card.title}</p>
                    {(card.studentExplanation || card.quoteText) && (
                      <p className="text-sm text-foreground-muted mt-1 line-clamp-2">
                        {card.quoteText ? `“${card.quoteText}”` : card.studentExplanation}
                      </p>
                    )}

                    <div className="mt-3 pt-3 border-t border-border">
                      <MarkCheckedButton cardId={card.id} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
