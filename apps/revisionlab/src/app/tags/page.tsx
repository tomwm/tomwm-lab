import Link from "next/link";
import { getAllTags } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";

export default async function TagsPage() {
  const tags = await getAllTags();
  const crossText = tags.filter((t) => t.textTitles.length > 1);
  const singleText = tags.filter((t) => t.textTitles.length <= 1);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">Threads across texts</h1>
        <p className="text-sm text-foreground-muted">
          Tags pull the same idea out of different texts. The ones that appear in more than one text are where
          comparison work starts — tag more cards to grow these.
        </p>
      </div>

      {crossText.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Appearing in more than one text</h2>
          <div className="space-y-2">
            {crossText.map((t) => (
              <Link
                key={t.tag}
                href={`/tags/${encodeURIComponent(t.tag)}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3 hover:border-primary/40"
              >
                <span className="font-medium text-sm text-foreground">#{t.tag}</span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {t.textTitles.map((title) => (
                    <Badge key={title}>{title}</Badge>
                  ))}
                  <span className="text-xs text-foreground-muted ml-1">{t.count} cards</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Within a single text</h2>
        {singleText.length === 0 ? (
          <p className="text-sm text-foreground-muted">Nothing here yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {singleText.map((t) => (
              <Link
                key={t.tag}
                href={`/tags/${encodeURIComponent(t.tag)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm hover:border-primary/40"
              >
                #{t.tag}
                <span className="text-xs text-foreground-muted">{t.count}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
