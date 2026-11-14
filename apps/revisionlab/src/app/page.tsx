import Link from "next/link";
import { getTexts, countDueReviews, getEssays, getCardsForText, getCardsNeedingChecking } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ACCENT_COLORS, friendlyDate } from "@/lib/utils";
import { ArrowRight, RotateCcw, PenLine, BookOpen, HelpCircle, ShieldAlert } from "lucide-react";

export default async function DashboardPage() {
  const allTexts = await getTexts();
  const [dueCount, essays, needsChecking] = await Promise.all([countDueReviews(), getEssays(), getCardsNeedingChecking()]);
  const cardCounts = await Promise.all(allTexts.map((t) => getCardsForText(t.id)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">Your texts</h1>
        <p className="text-sm text-foreground-muted">
          OCR English Literature H472 (provisional) — exams expected summer 2028.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface-muted/60 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="mb-1">
              <strong>New here?</strong> Click a text below to see its chapters/scenes, add or edit a few cards as you
              read, then use Practice to test yourself and Essays for feedback on your writing.
            </p>
            <Link href="/about" className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
              <HelpCircle className="size-3.5" /> Read the full guide
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {allTexts.map((t, i) => (
          <Link
            key={t.id}
            href={`/texts/${t.slug}`}
            className="group rounded-xl border border-border bg-surface p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="size-2.5 rounded-full shrink-0" style={{ background: ACCENT_COLORS[t.accentKey] }} />
                  <h3 className="font-serif text-lg font-semibold text-foreground">{t.title}</h3>
                </div>
                <p className="text-sm text-foreground-muted mb-3">{t.author}</p>
              </div>
              <ArrowRight className="size-4 text-foreground-muted group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
            </div>
            <p className="text-sm text-foreground-muted mb-3 line-clamp-2">{t.summary}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{cardCounts[i].length} cards</Badge>
              {t.assessmentComponent ? (
                <Badge className="bg-success-bg text-success border-success/30 border">
                  {t.assessmentComponent === "exam" ? "Exam text" : "Coursework"}
                </Badge>
              ) : (
                <Badge className="bg-warning-bg text-warning border-warning/30 border">Exam or coursework? Not set</Badge>
              )}
            </div>
          </Link>
        ))}
      </div>

      <p className="text-xs text-foreground-muted -mt-4">
        OCR splits the qualification into assessment components — exam papers and coursework. Which one each text belongs
        to isn&rsquo;t confirmed for 2028, so the app leaves it unset rather than guessing. Set it in{" "}
        <Link href="/settings" className="text-primary hover:underline">Settings</Link> once you know.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="size-4 text-primary" /> Practice
            </CardTitle>
            <Link href="/practice" className="text-sm text-primary hover:underline">
              Go to practice
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{dueCount}</p>
            <p className="text-sm text-foreground-muted">
              {dueCount === 0 ? "Nothing due right now — nicely kept up." : "prompts due for retrieval practice"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PenLine className="size-4 text-primary" /> Essays
            </CardTitle>
            <Link href="/essays" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {essays.length === 0 ? (
              <p className="text-sm text-foreground-muted">
                No practice essays submitted yet. <Link href="/essays/new" className="text-primary hover:underline">Submit one</Link> to get focused feedback.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {essays.slice(0, 3).map((e) => (
                  <li key={e.id} className="text-sm">
                    <Link href={`/essays/${e.id}`} className="text-foreground hover:text-primary line-clamp-1">
                      {e.questionText}
                    </Link>
                    <span className="text-xs text-foreground-muted"> — {friendlyDate(e.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-primary" /> Needs checking
            </CardTitle>
            <Link href="/needs-checking" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{needsChecking.length}</p>
            <p className="text-sm text-foreground-muted">
              {needsChecking.length === 0 ? "Nothing flagged right now." : "cards with something unverified — a quote, a citation, a fact"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
