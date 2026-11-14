"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStructureNode, updateStructureNode, deleteStructureNode } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Check, Pencil } from "lucide-react";
import type { structureNodes as structureNodesTable } from "@/db/schema";

type Node = typeof structureNodesTable.$inferSelect;
type Kind = Node["kind"];

const KINDS: Kind[] = ["act", "scene", "chapter", "document", "poem", "section", "movement"];

export function AddStructureNode({
  textId,
  nodes,
  defaultKind,
}: {
  textId: string;
  nodes: Node[];
  defaultKind: Kind;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [title, setTitle] = useState("");
  const [locationRef, setLocationRef] = useState("");
  const [summary, setSummary] = useState("");
  const [significance, setSignificance] = useState("");
  const [insertAfter, setInsertAfter] = useState("");
  const [isRealWorldEvent, setIsRealWorldEvent] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      await createStructureNode({
        textId,
        kind,
        title: title.trim(),
        locationRef: locationRef.trim() || title.trim(),
        summary: summary.trim() || null,
        significance: significance.trim() || null,
        isRealWorldEvent,
        insertAfterNodeId: isRealWorldEvent ? null : insertAfter || null,
      });
      setTitle("");
      setLocationRef("");
      setSummary("");
      setSignificance("");
      setInsertAfter("");
      setIsRealWorldEvent(false);
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add a section
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-4 space-y-3 bg-surface">
      <p className="text-xs text-foreground-muted">
        The structure is a starting point, not fixed — split a chapter, add a beat you want to track, or record a scene
        this seed didn&rsquo;t include.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs font-medium text-foreground-muted mb-1">Type</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
            className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k[0].toUpperCase() + k.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className={`block ${isRealWorldEvent ? "opacity-40 pointer-events-none" : ""}`}>
          <span className="block text-xs font-medium text-foreground-muted mb-1">Insert after</span>
          <select
            value={insertAfter}
            onChange={(e) => setInsertAfter(e.target.value)}
            disabled={isRealWorldEvent}
            className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm"
          >
            <option value="">At the end</option>
            {[...nodes]
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.locationRef} — {n.title}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs font-medium text-foreground-muted mb-1">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Gloucester's suicide attempt"
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-foreground-muted mb-1">Reference</span>
          <input
            value={locationRef}
            onChange={(e) => setLocationRef(e.target.value)}
            placeholder="e.g. 4.6"
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-xs font-medium text-foreground-muted mb-1">What happens</span>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-medium text-foreground-muted mb-1">Why it matters</span>
        <textarea
          value={significance}
          onChange={(e) => setSignificance(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-foreground-muted">
        <input type="checkbox" checked={isRealWorldEvent} onChange={(e) => setIsRealWorldEvent(e.target.checked)} />
        This is publication or performance history, not an event in the story
      </label>

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={pending || !title.trim()}>
          Add section
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function StructureNodeActions({ node, onEdit }: { node: Node; onEdit: () => void }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 shrink-0">
      {node.needsVerification && (
        <button
          title="Mark as verified against your own text"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateStructureNode(node.id, { needsVerification: false });
              router.refresh();
            })
          }
          className="inline-flex items-center gap-1 text-[11px] text-warning hover:text-foreground border border-warning/30 bg-warning-bg rounded-full px-2 py-0.5"
        >
          <Check className="size-3" /> Verify
        </button>
      )}
      <button title="Edit this section" onClick={onEdit} className="text-foreground-muted hover:text-primary">
        <Pencil className="size-3.5" />
      </button>
      <button
        title="Delete this section"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Delete "${node.title}"? Cards stay, but lose their link to this section.`)) return;
          startTransition(async () => {
            await deleteStructureNode(node.id);
            router.refresh();
          });
        }}
        className="text-foreground-muted hover:text-danger"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

/** Inline edit for a structure node — the seeded default is a starting point,
 *  so every field the app supplied has to be hers to change. */
export function EditStructureNode({ node, onDone }: { node: Node; onDone: () => void }) {
  const [title, setTitle] = useState(node.title);
  const [locationRef, setLocationRef] = useState(node.locationRef);
  const [narratorOrPov, setNarratorOrPov] = useState(node.narratorOrPov ?? "");
  const [summary, setSummary] = useState(node.summary ?? "");
  const [significance, setSignificance] = useState(node.significance ?? "");
  const [dateInWorld, setDateInWorld] = useState(node.dateInWorld ?? "");
  const [chronologyLabel, setChronologyLabel] = useState(node.chronologyLabel ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    if (!title.trim()) return;
    startTransition(async () => {
      await updateStructureNode(node.id, {
        title: title.trim(),
        locationRef: locationRef.trim() || title.trim(),
        narratorOrPov: narratorOrPov.trim() || null,
        summary: summary.trim() || null,
        significance: significance.trim() || null,
        dateInWorld: dateInWorld.trim() || null,
        chronologyLabel: chronologyLabel.trim() || null,
        // Editing it counts as checking it — the warning was about the app's
        // uncertainty, and she's just overwritten it with her own reading.
        needsVerification: false,
      });
      onDone();
      router.refresh();
    });
  }

  const inputClass = "w-full rounded-md border border-border px-2 py-1.5 text-sm";

  return (
    <div className="rounded-lg border border-primary/40 bg-surface p-3 space-y-3">
      <div className="grid sm:grid-cols-[2fr_1fr] gap-3">
        <label className="block">
          <span className="block text-xs font-medium text-foreground-muted mb-1">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-foreground-muted mb-1">Reference</span>
          <input value={locationRef} onChange={(e) => setLocationRef(e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs font-medium text-foreground-muted mb-1">Narrator / POV</span>
          <input value={narratorOrPov} onChange={(e) => setNarratorOrPov(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-foreground-muted mb-1">Date in the story</span>
          <input value={dateInWorld} onChange={(e) => setDateInWorld(e.target.value)} className={inputClass} />
        </label>
      </div>

      <label className="block">
        <span className="block text-xs font-medium text-foreground-muted mb-1">What happens</span>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className={inputClass} />
      </label>

      <label className="block">
        <span className="block text-xs font-medium text-foreground-muted mb-1">Why it matters</span>
        <textarea value={significance} onChange={(e) => setSignificance(e.target.value)} rows={2} className={inputClass} />
      </label>

      <label className="block">
        <span className="block text-xs font-medium text-foreground-muted mb-1">
          When it happened (leave blank if deliberately uncertain)
        </span>
        <input value={chronologyLabel} onChange={(e) => setChronologyLabel(e.target.value)} className={inputClass} />
      </label>

      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending || !title.trim()}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
