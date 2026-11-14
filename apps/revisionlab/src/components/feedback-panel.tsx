import { Badge } from "@/components/ui/badge";
import type { essayFeedback } from "@/db/schema";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

type Feedback = typeof essayFeedback.$inferSelect;

export function FeedbackPanel({ feedback }: { feedback: Feedback; essaySubmittedText: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-lg font-semibold text-foreground">Feedback</h3>
        <div className="flex items-center gap-2">
          {feedback.isDemo && (
            <Badge className="bg-warning-bg text-warning border-warning/30 border flex items-center gap-1">
              <AlertTriangle className="size-3" /> Demonstration feedback — not a real assessment
            </Badge>
          )}
          {!feedback.isDemo && (
            <Badge className="bg-surface-muted text-foreground-muted border-border border">{feedback.aiModel}</Badge>
          )}
        </div>
      </div>

      {feedback.mark != null ? (
        <div className="flex items-center gap-3">
          <span className="text-2xl font-semibold text-foreground">
            {feedback.mark}
            {feedback.maxMark != null && <span className="text-foreground-muted text-lg">/{feedback.maxMark}</span>}
          </span>
          {feedback.levelLabel && <Badge>{feedback.levelLabel}</Badge>}
        </div>
      ) : (
        feedback.missingForMark && (
          <p className="text-sm text-foreground-muted flex items-start gap-2 bg-info-bg text-info rounded-lg p-3">
            <Info className="size-4 shrink-0 mt-0.5" /> {feedback.missingForMark}
          </p>
        )
      )}

      {feedback.strengths.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-success flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="size-4" /> Strengths
          </h4>
          <ul className="space-y-2">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-sm">
                <p className="text-foreground">{s.point}</p>
                {s.anchor && <blockquote className="text-foreground-muted italic border-l-2 border-success/40 pl-2 mt-1">&ldquo;{s.anchor}&rdquo;</blockquote>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.improvements.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-warning flex items-center gap-1.5 mb-2">
            <AlertTriangle className="size-4" /> Priority improvements
          </h4>
          <ul className="space-y-2">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="text-sm">
                <p className="text-foreground">{s.point}</p>
                {s.anchor && <blockquote className="text-foreground-muted italic border-l-2 border-warning/40 pl-2 mt-1">&ldquo;{s.anchor}&rdquo;</blockquote>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.anchoredComments.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Comments on specific passages</h4>
          <ul className="space-y-2">
            {feedback.anchoredComments.map((c, i) => (
              <li key={i} className="text-sm rounded-lg bg-surface-muted p-3">
                <p className="italic text-foreground-muted">&ldquo;{c.excerpt}&rdquo;</p>
                <p className="text-foreground mt-1">{c.comment}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.revisionTask && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <h4 className="text-sm font-semibold text-primary mb-1">Revision task</h4>
          <p className="text-sm text-foreground">{feedback.revisionTask}</p>
        </div>
      )}
    </div>
  );
}
