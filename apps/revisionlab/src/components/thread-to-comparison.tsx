"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createComparisonFromTag } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { GitCompare } from "lucide-react";

export function ThreadToComparison({
  tag,
  texts,
}: {
  tag: string;
  texts: { id: string; title: string; slug: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<string[]>(texts.slice(0, 2).map((t) => t.id));
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(id: string) {
    setSelected((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  function submit() {
    if (!title.trim() || selected.length < 2) return;
    startTransition(async () => {
      const id = await createComparisonFromTag(tag, selected, title.trim());
      const home = texts.find((t) => t.id === selected[0]);
      router.push(`/texts/${home?.slug ?? texts[0].slug}/cards/${id}`);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <GitCompare className="size-4" /> Turn this into a comparison
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-surface p-4 space-y-3 max-w-xl">
      <p className="text-xs text-foreground-muted">
        A shared tag only says both texts touch this. A comparison card is where you write the specific,
        arguable difference — which is what actually earns credit.
      </p>

      <div>
        <span className="block text-xs font-medium text-foreground-muted mb-1.5">Comparing</span>
        <div className="flex flex-wrap gap-2">
          {texts.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selected.includes(t.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-surface text-foreground-muted"
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="block text-xs font-medium text-foreground-muted mb-1">
          What&rsquo;s the comparison? Be specific — not &ldquo;both explore {tag}&rdquo;
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Authority that depends on being performed"
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </label>

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={pending || !title.trim() || selected.length < 2}>
          Create comparison card
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
