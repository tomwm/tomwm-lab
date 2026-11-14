"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCardSection } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { structureNodes as structureNodesTable, cards as cardsTable } from "@/db/schema";

type Node = typeof structureNodesTable.$inferSelect;
type CardRow = typeof cardsTable.$inferSelect;

const TRACK_LABELS: Record<string, string> = {
  lear_plot: "Lear plot",
  gloucester_plot: "Gloucester plot",
  shared: "Both",
};

export function PresenceGrid({
  nodes,
  characters,
  presence,
  supportsChronology,
}: {
  nodes: Node[];
  characters: CardRow[];
  presence: { nodeId: string; cardId: string }[];
  supportsChronology: boolean;
}) {
  const [axis, setAxis] = useState<"narrative" | "chronology">("narrative");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const present = useMemo(() => new Set(presence.map((p) => `${p.nodeId}:${p.cardId}`)), [presence]);

  const ordered = useMemo(() => {
    if (axis === "chronology") {
      return [...nodes]
        .filter((n) => n.chronologyOrderIndex != null)
        .sort((a, b) => (a.chronologyOrderIndex ?? 0) - (b.chronologyOrderIndex ?? 0));
    }
    return [...nodes].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [nodes, axis]);

  const unplaced = axis === "chronology" ? nodes.filter((n) => n.chronologyOrderIndex == null) : [];

  function toggle(nodeId: string, cardId: string) {
    startTransition(async () => {
      await toggleCardSection(nodeId, cardId);
      router.refresh();
    });
  }

  if (characters.length === 0) {
    return (
      <p className="text-sm text-foreground-muted py-8 text-center">
        No character cards for this text yet. Add some — the grid builds itself from them.
      </p>
    );
  }

  return (
    <div>
      {supportsChronology && (
        <div className="flex gap-1 mb-4">
          <Button size="sm" variant={axis === "narrative" ? "default" : "outline"} onClick={() => setAxis("narrative")}>
            Order told
          </Button>
          <Button size="sm" variant={axis === "chronology" ? "default" : "outline"} onClick={() => setAxis("chronology")}>
            Order it happened
          </Button>
        </div>
      )}

      <p className="text-xs text-foreground-muted mb-3">
        Click any cell to record whether a character appears. Look for rows that stop, start late, or never overlap —
        that&rsquo;s structure you can write about.
      </p>

      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background text-left align-bottom pr-3 pb-2 min-w-[7rem]">
                <span className="text-xs font-medium text-foreground-muted">Character</span>
              </th>
              {ordered.map((n) => {
                // Rotated headers collide once labels get long (Beloved's
                // "Part One, recalled throughout"), so truncate and keep the
                // full reference and title in the tooltip.
                const label = n.locationRef.length > 14 ? `${n.locationRef.slice(0, 13)}…` : n.locationRef;
                return (
                  <th key={n.id} className="align-bottom pb-2 px-0.5">
                    <div className="w-9 mx-auto">
                      <div className="h-28 flex items-end justify-center">
                        <span
                          className="text-[11px] text-foreground-muted whitespace-nowrap origin-bottom-left translate-x-3 -rotate-60 block"
                          title={`${n.locationRef} — ${n.title}`}
                        >
                          {label}
                        </span>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {characters.map((char) => (
              <tr key={char.id}>
                <td className="sticky left-0 z-10 bg-background pr-3 py-1 whitespace-nowrap">
                  <span className="font-serif text-sm text-foreground">{char.title}</span>
                </td>
                {ordered.map((n) => {
                  const isPresent = present.has(`${n.id}:${char.id}`);
                  return (
                    <td key={n.id} className="px-0.5 py-1">
                      <button
                        disabled={pending}
                        onClick={() => toggle(n.id, char.id)}
                        title={`${char.title} — ${n.title}`}
                        className={cn(
                          "w-9 h-7 rounded border transition-colors mx-auto block",
                          isPresent
                            ? "bg-primary/70 border-primary/70 hover:bg-primary"
                            : "bg-surface border-border hover:border-primary/40"
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            {nodes.some((n) => n.track) && (
              <tr>
                <td className="sticky left-0 z-10 bg-background pr-3 pt-3 whitespace-nowrap">
                  <span className="text-xs font-medium text-foreground-muted">Plot</span>
                </td>
                {ordered.map((n) => (
                  <td key={n.id} className="px-0.5 pt-3">
                    <div
                      className="w-9 h-5 rounded text-[9px] flex items-center justify-center text-foreground-muted bg-surface-muted mx-auto overflow-hidden"
                      title={TRACK_LABELS[n.track ?? "shared"] ?? n.track ?? ""}
                    >
                      {(TRACK_LABELS[n.track ?? "shared"] ?? "").slice(0, 4)}
                    </div>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {unplaced.length > 0 && (
        <p className="text-xs text-foreground-muted mt-3">
          {unplaced.length} section{unplaced.length === 1 ? "" : "s"} not shown here — chronology deliberately uncertain.
        </p>
      )}
    </div>
  );
}
