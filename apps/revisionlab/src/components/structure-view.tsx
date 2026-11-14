"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AddStructureNode, StructureNodeActions, EditStructureNode } from "@/components/structure-editor";
import type { structureNodes as structureNodesTable } from "@/db/schema";

type Node = typeof structureNodesTable.$inferSelect;

const TRACK_LABELS: Record<string, string> = {
  lear_plot: "Lear plot",
  gloucester_plot: "Gloucester plot",
  shared: "Both plots",
};

export function StructureView({
  textId,
  textSlug,
  structureMode,
  nodes,
  cardCounts,
}: {
  textId: string;
  textSlug: string;
  structureMode: string;
  nodes: Node[];
  /** How many cards are bound to each section, keyed by node id. */
  cardCounts: Record<string, number>;
}) {
  const shared = { textId, textSlug, cardCounts };
  if (structureMode === "narration_vs_chronology") {
    return <ChronologyStructure {...shared} nodes={nodes} />;
  }
  if (structureMode === "acts_scenes" && nodes.some((n) => n.track)) {
    return <TrackStructure {...shared} nodes={nodes} />;
  }
  return <SimpleStructure {...shared} nodes={nodes} />;
}

function NodeCard({ node, textSlug, cardCount, trackLabel = null }: { node: Node; textSlug: string; cardCount: number; trackLabel?: string | null }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditStructureNode node={node} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="flex gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-2 min-w-0">
            <h4 className="font-serif font-semibold text-sm text-foreground">{node.title}</h4>
            <span className="text-xs text-foreground-muted">{node.locationRef}</span>
            {trackLabel && (
              <span className="text-[10px] uppercase tracking-wide rounded-full border border-border bg-surface-muted px-1.5 py-0.5 text-foreground-muted">
                {trackLabel}
              </span>
            )}
            {node.dateInWorld && <span className="text-xs text-foreground-muted italic">{node.dateInWorld}</span>}
            {node.isUserAdded && <span className="text-[11px] text-primary">added by you</span>}
            {node.needsVerification && (
              <span className="text-[11px] text-warning" title="This seed worked from general knowledge here — check it against your text">
                check against your text
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/texts/${textSlug}/sections/${node.id}`}
              title={
                cardCount > 0
                  ? `See the ${cardCount} card${cardCount === 1 ? "" : "s"} linked to this section`
                  : "Nothing linked here yet — open it to add something"
              }
              className={
                cardCount > 0
                  ? "text-[11px] rounded-full border border-border bg-surface-muted px-2 py-0.5 text-foreground-muted hover:border-primary/40 hover:text-foreground"
                  : "text-[11px] rounded-full border border-dashed border-border px-2 py-0.5 text-foreground-muted/70 hover:border-primary/40 hover:text-foreground"
              }
            >
              {cardCount > 0 ? `${cardCount} card${cardCount === 1 ? "" : "s"}` : "no cards"}
            </Link>
            <StructureNodeActions node={node} onEdit={() => setEditing(true)} />
          </div>
        </div>
        {node.narratorOrPov && <p className="text-xs text-foreground-muted mt-0.5">Narrator/POV: {node.narratorOrPov}</p>}
        {node.summary && <p className="text-sm text-foreground mt-1">{node.summary}</p>}
        {node.significance && <p className="text-sm text-foreground-muted mt-1 italic">{node.significance}</p>}
      </div>
    </div>
  );
}

function SimpleStructure({ textId, textSlug, nodes, cardCounts }: { textId: string; textSlug: string; nodes: Node[]; cardCounts: Record<string, number> }) {
  return (
    <div className="space-y-2">
      {nodes.map((n) => (
        <NodeCard key={n.id} node={n} textSlug={textSlug} cardCount={cardCounts[n.id] ?? 0} />
      ))}
      <div className="pt-2">
        <AddStructureNode textId={textId} nodes={nodes} defaultKind="chapter" />
      </div>
    </div>
  );
}

function TrackStructure({ textId, textSlug, nodes, cardCounts }: { textId: string; textSlug: string; nodes: Node[]; cardCounts: Record<string, number> }) {
  const tracks = useMemo(() => {
    const set = new Set(nodes.map((n) => n.track ?? "shared"));
    return ["all", ...Array.from(set)];
  }, [nodes]);
  const [activeTrack, setActiveTrack] = useState("all");

  const filtered = activeTrack === "all" ? nodes : nodes.filter((n) => (n.track ?? "shared") === activeTrack);

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-4">
        {tracks.map((t) => (
          <Button key={t} size="sm" variant={activeTrack === t ? "default" : "outline"} onClick={() => setActiveTrack(t)}>
            {t === "all" ? "All scenes" : TRACK_LABELS[t] ?? t}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((n) => (
          <NodeCard
            key={n.id}
            node={n}
            textSlug={textSlug}
            cardCount={cardCounts[n.id] ?? 0}
            trackLabel={activeTrack === "all" && n.track ? TRACK_LABELS[n.track] ?? n.track : null}
          />
        ))}
        <div className="pt-2">
          <AddStructureNode textId={textId} nodes={nodes} defaultKind="scene" />
        </div>
      </div>
    </div>
  );
}

function ChronologyStructure({ textId, textSlug, nodes, cardCounts }: { textId: string; textSlug: string; nodes: Node[]; cardCounts: Record<string, number> }) {
  const [view, setView] = useState<"narrative" | "chronology">("narrative");

  const ordered =
    view === "narrative"
      ? [...nodes].sort((a, b) => a.orderIndex - b.orderIndex)
      : [...nodes].sort((a, b) => (a.chronologyOrderIndex ?? 999) - (b.chronologyOrderIndex ?? 999));

  const placed = ordered.filter((n) => view === "narrative" || n.chronologyOrderIndex != null);
  const unplaced = view === "chronology" ? ordered.filter((n) => n.chronologyOrderIndex == null) : [];

  return (
    <div>
      <div className="flex gap-1 mb-4">
        <Button size="sm" variant={view === "narrative" ? "default" : "outline"} onClick={() => setView("narrative")}>
          Narrative order
        </Button>
        <Button size="sm" variant={view === "chronology" ? "default" : "outline"} onClick={() => setView("chronology")}>
          Chronology (where known)
        </Button>
      </div>
      {view === "chronology" && (
        <p className="text-xs text-foreground-muted mb-3">
          Ordered by what&rsquo;s placed in time. This novel deliberately keeps some events uncertain — that&rsquo;s part of its method, not a gap to fill in.
        </p>
      )}
      <div className="space-y-2">
        {placed.map((n) => (
          <div key={n.id}>
            <NodeCard node={n} textSlug={textSlug} cardCount={cardCounts[n.id] ?? 0} />
            {view === "chronology" && n.chronologyLabel && (
              <p className="text-xs text-foreground-muted italic ml-8 mt-1">{n.chronologyLabel}</p>
            )}
          </div>
        ))}
      </div>
      {unplaced.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-foreground-muted mb-2">Chronology uncertain / not placed</h4>
          <div className="space-y-2">
            {unplaced.map((n) => (
              <NodeCard key={n.id} node={n} textSlug={textSlug} cardCount={cardCounts[n.id] ?? 0} />
            ))}
          </div>
        </div>
      )}
      <div className="pt-4">
        <AddStructureNode textId={textId} nodes={nodes} defaultKind="movement" />
      </div>
    </div>
  );
}
