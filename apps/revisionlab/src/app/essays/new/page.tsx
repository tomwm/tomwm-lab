import { getTexts } from "@/lib/queries";
import { EssayForm } from "@/components/essay-form";

// Submitting marks the essay with Claude inside the server action, which runs
// under this page's time limit. A full mark takes tens of seconds; a short
// limit would cut it off and drop her to demo feedback.
export const maxDuration = 60;

export default async function NewEssayPage() {
  const texts = await getTexts();
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">Submit an essay</h1>
        <p className="text-sm text-foreground-muted">
          This is practice, not live coursework — the coaching and rewriting workflow here should not be used for assessed coursework under exam-board rules.
        </p>
      </div>
      <EssayForm texts={texts.map((t) => ({ id: t.id, title: t.title }))} />
    </div>
  );
}
