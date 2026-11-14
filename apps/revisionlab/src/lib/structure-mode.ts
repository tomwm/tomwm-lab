/**
 * Whether a text's structure renders a view-toggle row (plot tracks, narrative
 * vs chronology) above its section list.
 *
 * Kept out of structure-view.tsx because that's a client module: a server page
 * importing a plain function from it gets a client reference it can't call. The
 * page uses this to drop the sidebar by the row's height so it lines up with
 * the first section rather than the toggles.
 */
export function hasViewToggle(structureMode: string, nodes: { track: string | null }[]): boolean {
  return (
    structureMode === "narration_vs_chronology" ||
    (structureMode === "acts_scenes" && nodes.some((n) => n.track))
  );
}
