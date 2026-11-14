import Link from "next/link";
import { getCardsByTag } from "@/lib/queries";
import { CardTile } from "@/components/card-tile";
import { ThreadToComparison } from "@/components/thread-to-comparison";
import { ACCENT_COLORS } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const rows = await getCardsByTag(tag);

  const groups: { slug: string | null; title: string | null; accentKey: string | null; items: typeof rows }[] = [];
  for (const row of rows) {
    const key = row.textSlug ?? "unassigned";
    let group = groups.find((g) => (g.slug ?? "unassigned") === key);
    if (!group) {
      group = { slug: row.textSlug, title: row.textTitle, accentKey: row.textAccentKey, items: [] };
      groups.push(group);
    }
    group.items.push(row);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/tags" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-primary">
        <ArrowLeft className="size-4" /> All threads
      </Link>

      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">#{tag}</h1>
        <p className="text-sm text-foreground-muted">
          {rows.length} card{rows.length === 1 ? "" : "s"} across {groups.length} text{groups.length === 1 ? "" : "s"}.
          {groups.length > 1 && " Where the same idea works differently in two texts, that difference is the comparison."}
        </p>
      </div>

      {groups.length > 1 && (
        <ThreadToComparison
          tag={tag}
          texts={groups
            .filter((g) => g.slug && g.title)
            .map((g) => ({ id: g.items[0].card.primaryTextId!, title: g.title!, slug: g.slug! }))}
        />
      )}

      {groups.map((group) => (
        <div key={group.slug ?? "unassigned"}>
          <div className="flex items-center gap-2 mb-3">
            <span className="size-2.5 rounded-full shrink-0" style={{ background: ACCENT_COLORS[group.accentKey ?? "info"] }} />
            <h2 className="font-serif text-lg font-semibold text-foreground">{group.title ?? "No text"}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((row) => (
              <CardTile key={row.card.id} card={row.card} textSlug={row.textSlug ?? ""} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
