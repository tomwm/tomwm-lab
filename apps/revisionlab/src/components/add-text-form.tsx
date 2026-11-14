"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createText, type StructureMode } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Plain-English framing of structureMode — she shouldn't have to know the
// internal name, only how the text is put together.
const STRUCTURE_CHOICES: { value: StructureMode; label: string; hint: string }[] = [
  { value: "chapters", label: "Chapters", hint: "A novel told in order" },
  { value: "acts_scenes", label: "Acts and scenes", hint: "A play" },
  {
    value: "narration_vs_chronology",
    label: "Told out of order",
    hint: "Events aren't in the order they happened — adds a chronology view",
  },
  { value: "poems", label: "Individual poems", hint: "A collection" },
];

export function AddTextForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [structureMode, setStructureMode] = useState<StructureMode>("chapters");
  const [summary, setSummary] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!title.trim() || !author.trim()) return;
    startTransition(async () => {
      const slug = await createText({ title, author, structureMode, summary: summary || null });
      router.push(`/texts/${slug}`);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add a text
      </Button>
    );
  }

  const inputClass = "w-full rounded-md border border-border px-3 py-2 text-sm";

  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
      <p className="text-xs text-foreground-muted">
        For a poetry collection, a coursework text, or anything else you end up studying. It starts empty — add sections
        and cards as you go.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs font-medium text-foreground-muted mb-1">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-foreground-muted mb-1">Author</span>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} />
        </label>
      </div>

      <div>
        <span className="block text-xs font-medium text-foreground-muted mb-1.5">How is it organised?</span>
        <div className="grid sm:grid-cols-2 gap-2">
          {STRUCTURE_CHOICES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setStructureMode(c.value)}
              className={`text-left rounded-md border px-3 py-2 transition-colors ${
                structureMode === c.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface hover:border-primary/40"
              }`}
            >
              <span className="block text-sm font-medium text-foreground">{c.label}</span>
              <span className="block text-xs text-foreground-muted">{c.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="block text-xs font-medium text-foreground-muted mb-1">
          A note about how to read it (optional)
        </span>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={inputClass} />
      </label>

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={pending || !title.trim() || !author.trim()}>
          {pending ? "Adding…" : "Add text"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
