import { notFound } from "next/navigation";
import Link from "next/link";
import { getEssay, getTexts, getFeedbackForEssay } from "@/lib/queries";
import { EssayForm } from "@/components/essay-form";
import { ArrowLeft } from "lucide-react";

// Resubmitting marks the revision with Claude inside the server action, which
// runs under this page's time limit (see essays/new/page.tsx).
export const maxDuration = 60;

export default async function ReviseEssayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const essay = await getEssay(id);
  if (!essay) notFound();

  const [texts, feedback] = await Promise.all([getTexts(), getFeedbackForEssay(id)]);
  const revisionTask = feedback[0]?.revisionTask;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/essays/${id}`} className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-primary">
        <ArrowLeft className="size-4" /> Back to previous attempt
      </Link>
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">Revised attempt</h1>
        {revisionTask && (
          <p className="text-sm text-foreground-muted bg-primary/5 border border-primary/20 rounded-lg p-3">
            Last time&rsquo;s revision task: {revisionTask}
          </p>
        )}
      </div>
      <EssayForm
        texts={texts.map((t) => ({ id: t.id, title: t.title }))}
        parentEssayId={id}
        initial={{
          questionText: essay.questionText,
          questionType: essay.questionType ?? undefined,
          marksAvailable: essay.marksAvailable,
          assessmentObjectives: essay.assessmentObjectives ?? undefined,
          textIds: essay.textIds,
          extractText: essay.extractText ?? undefined,
        }}
      />
    </div>
  );
}
