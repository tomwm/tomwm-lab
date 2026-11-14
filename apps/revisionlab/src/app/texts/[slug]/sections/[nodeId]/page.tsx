import { notFound } from "next/navigation";
import Link from "next/link";
import { getTextBySlug, getStructureNode, getCardsForNode } from "@/lib/queries";
import { CardTile } from "@/components/card-tile";
import { buttonVariants } from "@/components/ui/button";
import { ACCENT_COLORS } from "@/lib/utils";
import { ArrowLeft, Plus } from "lucide-react";

const TRACK_LABELS: Record<string, string> = {
  lear_plot: "Lear plot",
  gloucester_plot: "Gloucester plot",
  shared: "Both plots",
};

export default async function SectionPage({
  params,
}: {
  params: Promise<{ slug: string; nodeId: string }>;
}) {
  const { slug, nodeId } = await params;
  const text = await getTextBySlug(slug);
  if (!text) notFound();

  const node = await getStructureNode(nodeId);
  if (!node || node.textId !== text.id) notFound();

  const cards = await getCardsForNode(nodeId);

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        href={`/texts/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back to {text.title}
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="size-2.5 rounded-full shrink-0" style={{ background: ACCENT_COLORS[text.accentKey] }} />
          <span className="text-sm text-foreground-muted">{node.locationRef}</span>
          {node.track && (
            <span className="text-[10px] uppercase tracking-wide rounded-full border border-border bg-surface-muted px-1.5 py-0.5 text-foreground-muted">
              {TRACK_LABELS[node.track] ?? node.track}
            </span>
          )}
          {node.dateInWorld && <span className="text-xs text-foreground-muted italic">{node.dateInWorld}</span>}
        </div>

        <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">{node.title}</h1>

        {node.narratorOrPov && (
          <p className="text-sm text-foreground-muted mb-1">Narrator/POV: {node.narratorOrPov}</p>
        )}
        {node.summary && <p className="text-sm text-foreground max-w-2xl">{node.summary}</p>}
        {node.significance && <p className="text-sm text-foreground-muted italic mt-1 max-w-2xl">{node.significance}</p>}
        {node.chronologyLabel && (
          <p className="text-xs text-foreground-muted italic mt-2">When it happened: {node.chronologyLabel}</p>
        )}
      </div>

      <div className="border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            {cards.length} card{cards.length === 1 ? "" : "s"} linked to this section
          </h2>
          <Link
            href={`/texts/${slug}/cards/new?section=${node.id}`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            <Plus className="size-4" /> Add a card here
          </Link>
        </div>

        {cards.length === 0 ? (
          <p className="text-sm text-foreground-muted py-8 text-center">
            Nothing linked here yet. If this section matters, that&rsquo;s a gap worth filling — or link an existing card
            to it from the card&rsquo;s own page.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <CardTile key={c.id} card={c} textSlug={slug} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
