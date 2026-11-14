import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function friendlyDate(ms: number | null | undefined): string {
  if (!ms) return "—";
  const d = new Date(ms);
  if (isToday(d)) return `Today, ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, "HH:mm")}`;
  return format(d, "d MMM yyyy");
}

export function relativeTime(ms: number | null | undefined): string {
  if (!ms) return "never";
  return formatDistanceToNow(new Date(ms), { addSuffix: true });
}

export const CARD_TYPE_LABELS: Record<string, string> = {
  evidence: "Evidence",
  method: "Writer's method",
  theme: "Theme",
  character: "Character",
  context: "Context",
  interpretation: "Interpretation",
  comparison: "Comparison",
  performance: "Performance / Critical reading",
};

export const RELATION_LABELS: Record<string, string> = {
  supports: "supports",
  challenges: "challenges",
  contrasts_with: "contrasts with",
  develops: "develops",
  foreshadows: "foreshadows",
  provides_context_for: "provides context for",
};

// "Confident" rather than "Solid": this records *her* stance on the content,
// not a property of the content itself. "Solid" made a claim about the
// material — the same conflation just removed from the provenance badge.
export const CONFIDENCE_LABELS: Record<string, string> = {
  solid: "Confident",
  tentative: "Tentative",
  needs_checking: "Needs checking",
};

export const CONFIDENCE_COLORS: Record<string, string> = {
  solid: "bg-success-bg text-success border-success/30",
  tentative: "bg-warning-bg text-warning border-warning/30",
  needs_checking: "bg-danger-bg text-danger border-danger/30",
};

// Provenance answers only "who wrote this". "App-written" names the actual
// mechanism: an AI generated it at seed time from training knowledge — nothing
// was looked up or checked against a source. That distinction matters when
// she's deciding whether to cite something in an essay.
export const PROVENANCE_LABELS: Record<string, string> = {
  app_written: "App-written",
  student: "Your own",
};

export const ACCENT_COLORS: Record<string, string> = {
  dracula: "var(--text-dracula)",
  lear: "var(--text-lear)",
  beloved: "var(--text-beloved)",
  jerusalem: "var(--text-jerusalem)",
  "accent-1": "var(--text-accent-1)",
  "accent-2": "var(--text-accent-2)",
  "accent-3": "var(--text-accent-3)",
  "accent-4": "var(--text-accent-4)",
  info: "var(--info)",
};

/** Assigned in order to texts added later, so each gets its own colour. */
export const SPARE_ACCENT_KEYS = ["accent-1", "accent-2", "accent-3", "accent-4"];

export function wordCount(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}
