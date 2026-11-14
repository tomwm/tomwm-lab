import Link from "next/link";
import { getEssays, getFeedbackForEssay } from "@/lib/queries";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { friendlyDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function EssaysPage() {
  const essays = await getEssays();
  const feedbackByEssay = await Promise.all(
    essays.map(async (e) => ({ essay: e, feedback: (await getFeedbackForEssay(e.id))[0] ?? null }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">Essays</h1>
          <p className="text-sm text-foreground-muted">Practice essays and paragraphs, with feedback and revisions.</p>
        </div>
        <Link href="/essays/new" className={buttonVariants()}>
          <Plus className="size-4" /> Submit essay
        </Link>
      </div>

      {essays.length === 0 ? (
        <p className="text-sm text-foreground-muted py-10 text-center">No essays submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {feedbackByEssay.map(({ essay, feedback }) => (
            <Link
              key={essay.id}
              href={`/essays/${essay.id}`}
              className="block rounded-lg border border-border bg-surface p-4 hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground line-clamp-1">{essay.questionText}</p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {friendlyDate(essay.createdAt)} {essay.parentEssayId && "· revision"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {feedback?.isDemo && <Badge className="bg-warning-bg text-warning border-warning/30 border">Demo feedback</Badge>}
                  {feedback?.mark != null && feedback.maxMark != null && (
                    <Badge className="bg-info-bg text-info border-info/30 border">
                      {feedback.mark}/{feedback.maxMark}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
