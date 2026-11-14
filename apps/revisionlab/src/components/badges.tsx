import { Badge } from "@/components/ui/badge";
import { cn, CARD_TYPE_LABELS, CONFIDENCE_LABELS, CONFIDENCE_COLORS, PROVENANCE_LABELS } from "@/lib/utils";
import type { CardType } from "@/db/schema";

export function CardTypeBadge({ type }: { type: CardType }) {
  return <Badge>{CARD_TYPE_LABELS[type] ?? type}</Badge>;
}

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  return (
    <Badge className={cn("border", CONFIDENCE_COLORS[confidence])}>
      {CONFIDENCE_LABELS[confidence] ?? confidence}
    </Badge>
  );
}

export function ProvenanceBadge({ provenance }: { provenance: string }) {
  // Deliberately neutral: authorship shouldn't look like a quality rating.
  // Green here was half the reason it read as a duplicate of the confidence badge.
  const styles: Record<string, string> = {
    app_written: "bg-surface-muted text-foreground-muted border-border",
    student: "bg-primary/10 text-primary border-primary/30",
  };
  return <Badge className={cn("border", styles[provenance])}>{PROVENANCE_LABELS[provenance] ?? provenance}</Badge>;
}
