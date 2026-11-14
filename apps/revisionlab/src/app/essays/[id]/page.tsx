import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getEssay,
  getFeedbackForEssay,
  getDevelopMomentsForFeedback,
  getTextsByIds,
  getEssayChain,
} from "@/lib/queries";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { friendlyDate, wordCount } from "@/lib/utils";
import { FeedbackPanel } from "@/components/feedback-panel";
import { DevelopMomentPanel } from "@/components/develop-moment-panel";
import { DeleteEssayButton } from "@/components/delete-essay-button";
import { ArrowLeft } from "lucide-react";

// "Show me an example" on a develop moment calls Claude inside a server action,
// which runs under this page's time limit (see essays/new/page.tsx).
export const maxDuration = 60;

export default async function EssayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const essay = await getEssay(id);
  if (!essay) notFound();

  const [feedbackList, texts, chain] = await Promise.all([
    getFeedbackForEssay(id),
    getTextsByIds(essay.textIds),
    getEssayChain(id),
  ]);
  const latestFeedback = feedbackList[0] ?? null;
  const developMoments = latestFeedback ? await getDevelopMomentsForFeedback(latestFeedback.id) : [];

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/essays" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-primary">
        <ArrowLeft className="size-4" /> All essays
      </Link>

      {chain.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-foreground-muted">Revision chain:</span>
          {chain.map((e, i) => (
            <span key={e.id} className="flex items-center gap-2">
              <Link href={`/essays/${e.id}`} className={e.id === id ? "font-semibold text-foreground" : "text-primary hover:underline"}>
                Attempt {i + 1}
              </Link>
              {i < chain.length - 1 && <span className="text-foreground-muted">→</span>}
            </span>
          ))}
        </div>
      )}

      <div>
        <div className="flex flex-wrap gap-2 mb-2">
          {texts.map((t) => (
            <Badge key={t.id}>{t.title}</Badge>
          ))}
          {essay.timed && <Badge>Timed</Badge>}
          <Badge>{essay.openBook ? "Open-book" : "Closed-book"}</Badge>
          {essay.completedWithHelp && <Badge>Completed with help</Badge>}
        </div>
        <h1 className="font-serif text-xl font-semibold text-foreground mb-1">{essay.questionText}</h1>
        <p className="text-xs text-foreground-muted">
          Submitted {friendlyDate(essay.createdAt)} · {wordCount(essay.submittedText)} words
          {essay.questionType ? ` · ${essay.questionType}` : ""}
        </p>
      </div>

      {essay.extractText && (
        <details className="rounded-lg border border-border bg-surface-muted p-3 text-sm">
          <summary className="cursor-pointer font-medium">Extract given with the question</summary>
          <p className="mt-2 whitespace-pre-wrap">{essay.extractText}</p>
        </details>
      )}

      <details className="rounded-lg border border-border bg-surface p-3 text-sm" open>
        <summary className="cursor-pointer font-medium">Your essay</summary>
        <p className="mt-3 whitespace-pre-wrap font-serif leading-relaxed">{essay.submittedText}</p>
      </details>

      {latestFeedback && (
        <FeedbackPanel feedback={latestFeedback} essaySubmittedText={essay.submittedText} />
      )}

      {developMoments.map((dm) => (
        <DevelopMomentPanel key={dm.id} moment={dm} textIds={essay.textIds} />
      ))}

      <div className="border-t border-border pt-6 flex flex-wrap items-center gap-3">
        <Link href={`/essays/${id}/revise`} className={buttonVariants({ variant: "outline" })}>
          Submit a revised version
        </Link>
        <div className="ml-auto">
          <DeleteEssayButton
            essayId={id}
            laterRevisions={Math.max(0, chain.length - 1 - chain.findIndex((e) => e.id === id))}
          />
        </div>
      </div>
    </div>
  );
}
