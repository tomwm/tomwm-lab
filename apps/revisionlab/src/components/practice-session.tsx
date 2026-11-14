"use client";
import { useState } from "react";
import { recordReview, skipReview } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clozeQuote, type PracticeMode } from "@/lib/practice";
import type { ReviewResult } from "@/lib/srs";
import { CheckCircle2, ChevronLeft, PartyPopper, PenLine } from "lucide-react";
import { friendlyDate } from "@/lib/utils";

export interface PreviousAttempt {
  text: string;
  reviewedAt: number;
}

export interface PracticeItem {
  reviewStateId: string;
  promptType: string;
  mode: PracticeMode;
  question: string | null;
  cardTitle: string;
  cardType: string;
  locationRef: string | null;
  speakerOrNarrator: string | null;
  quoteText: string | null;
  studentExplanation: string | null;
  textTitle: string | null;
  previousAttempts: PreviousAttempt[];
}

interface Rating {
  result: ReviewResult;
  label: string;
  className: string;
}

const NEUTRAL = "border-border bg-surface text-foreground-muted hover:border-foreground-muted";
const WARNING = "border-warning/40 bg-warning-bg text-warning hover:border-warning";
const PRIMARY = "border-primary/40 bg-primary/10 text-primary hover:border-primary";
const SUCCESS = "border-success/40 bg-success-bg text-success hover:border-success";

// Plain language rather than spaced-repetition jargon, ordered as a scale of
// how much effort recall took. Deliberately no red: not recalling something is
// the normal case in retrieval practice, not a failure state.
const RECALL_RATINGS: Rating[] = [
  { result: "again", label: "Didn't get it", className: NEUTRAL },
  { result: "hard", label: "Struggled", className: WARNING },
  { result: "good", label: "Got it", className: PRIMARY },
  { result: "easy", label: "Knew it instantly", className: SUCCESS },
];

// Produce mode can't ask "were you right?" — there's no right answer. On a
// repeat visit the honest question is whether this attempt went further than
// the last one, which she can actually judge by reading them side by side.
const PRODUCE_RATINGS_REPEAT: Rating[] = [
  { result: "again", label: "Got stuck", className: NEUTRAL },
  { result: "hard", label: "About the same", className: WARNING },
  { result: "good", label: "Went further", className: SUCCESS },
];

// First time through there's nothing to compare against, so the scale asks
// about the attempt itself — without pretending to grade its quality.
const PRODUCE_RATINGS_FIRST: Rating[] = [
  { result: "again", label: "Couldn't get going", className: NEUTRAL },
  { result: "hard", label: "Got something down", className: WARNING },
  { result: "good", label: "Developed it properly", className: SUCCESS },
];

function ratingsFor(item: PracticeItem, hintUsed: boolean): { ratings: Rating[]; question: string } {
  if (item.mode === "recall") {
    // Needing the hint means it wasn't instant, whatever it felt like.
    return hintUsed
      ? { ratings: RECALL_RATINGS.filter((r) => r.result !== "easy"), question: "With the hint, how did that go?" }
      : { ratings: RECALL_RATINGS, question: "How did that go?" };
  }
  return item.previousAttempts.length > 0
    ? { ratings: PRODUCE_RATINGS_REPEAT, question: "Compared with last time…" }
    : { ratings: PRODUCE_RATINGS_FIRST, question: "How did that go?" };
}

const PROMPT_LABELS: Record<string, string> = {
  recall: "Trace it",
  evidence_retrieval: "Evidence retrieval",
  explain_effect: "Explain the effect",
  alternative_reading: "Alternative reading",
  context_link: "Context link",
  comparison: "Comparison",
  thesis: "Thesis",
  paragraph: "Paragraph",
  close_reading: "Close reading",
};

// Says what's about to happen, which matters more to her than the prompt's
// internal type: whether there's an answer waiting at the end of this or not.
const MODE_LABELS: Record<PracticeMode, string> = {
  recall: "Write it out, then check",
  produce: "Write it out — no answer key",
};

interface Draft {
  response: string;
  hintShown: boolean;
  revealed: boolean;
  /** Captured at the moment of revealing, not derived from the textarea — she
      shouldn't be able to type the answer in after seeing it and rate it recalled. */
  gaveUp: boolean;
}

const EMPTY_DRAFT: Draft = { response: "", hintShown: false, revealed: false, gaveUp: false };

// A rated prompt is finished: going back to it shows it read-only, because a
// second attempt after seeing the answer would test the last thirty seconds,
// not what she knows. A skipped one recorded and revealed nothing, so it stays
// open and can still be done properly.
type Outcome = { kind: "rated"; summary: string } | { kind: "skipped" };

export function PracticeSession({ items, aheadOfSchedule = false }: { items: PracticeItem[]; aheadOfSchedule?: boolean }) {
  // Freeze the queue for the duration of the session. recordReview revalidates
  // /practice, which refetches and re-sorts by due date — without this snapshot
  // the just-rated prompt moves to the back and the index lands on a different
  // question than the one she was working on. Changing the filters remounts the
  // component (keyed on the query string), which is when a new queue is wanted.
  const [queue] = useState(items);
  const [index, setIndex] = useState(0);
  // Kept per prompt, so moving back and forward never loses a half-written
  // answer, reopens a revealed answer for another go, or forgets a used hint.
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});

  if (queue.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <CheckCircle2 className="size-8 text-success mx-auto mb-3" />
        <p className="text-foreground font-medium mb-1">Nothing to practise here.</p>
        <p className="text-sm text-foreground-muted">Try widening the filters, or create some cards — new ones enter the queue straight away.</p>
      </div>
    );
  }

  if (index >= queue.length) {
    const results = Object.entries(outcomes);
    const done = {
      total: results.filter(([, o]) => o.kind === "rated").length,
      written: results.filter(([i, o]) => o.kind === "rated" && drafts[Number(i)]?.response.trim()).length,
      skipped: results.filter(([, o]) => o.kind === "skipped").length,
    };
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <PartyPopper className="size-8 text-primary mx-auto mb-3" />
        <p className="text-foreground font-medium mb-1">Session complete.</p>
        <p className="text-sm text-foreground-muted">
          {done.total} prompt{done.total === 1 ? "" : "s"} worked through
          {done.written > 0 && `, ${done.written} of them written out`}
          {done.skipped > 0 && ` · ${done.skipped} skipped for now`}.
        </p>
        {done.written > 0 && (
          <p className="text-xs text-foreground-muted mt-2">
            What you wrote is saved. Next time these come round you&rsquo;ll see it again — after
            you&rsquo;ve written the new one.
          </p>
        )}
        <Button variant="ghost" size="sm" className="mt-4" onClick={() => setIndex(queue.length - 1)}>
          <ChevronLeft className="size-4" /> Look back over this session
        </Button>
      </div>
    );
  }

  const item = queue[index];

  const outcome = outcomes[index];
  const finished = outcome?.kind === "rated";
  const { response, revealed, hintShown, gaveUp } = drafts[index] ?? EMPTY_DRAFT;
  const written = response.trim();
  const hasPrevious = item.previousAttempts.length > 0;
  const { ratings, question: ratingQuestion } = ratingsFor(item, hintShown);
  const cloze = item.mode === "recall" && item.quoteText ? clozeQuote(item.quoteText) : null;
  const hintAvailable = !!cloze && cloze.blankCount > 0;

  function update(patch: Partial<Draft>) {
    setDrafts((d) => ({ ...d, [index]: { ...(d[index] ?? EMPTY_DRAFT), ...patch } }));
  }

  function reveal() {
    update({ revealed: true, gaveUp: item.mode === "recall" && !written });
  }

  // Carry on from the first prompt after this one not yet dealt with. Doing a
  // skipped prompt on the way back then returns her to where she'd got to,
  // rather than walking her through ones she's already finished.
  function finish(next: Outcome) {
    const updated = { ...outcomes, [index]: next };
    setOutcomes(updated);
    let j = index + 1;
    while (j < queue.length && updated[j]) j++;
    setIndex(j);
  }

  function rate(result: ReviewResult, summary: string) {
    recordReview(item.reviewStateId, result, written || undefined);
    finish({ kind: "rated", summary });
  }

  function skip() {
    skipReview(item.reviewStateId);
    finish({ kind: "skipped" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
            className="inline-flex items-center gap-0.5 rounded-md py-1 pr-1.5 hover:text-foreground disabled:opacity-40 disabled:hover:text-foreground-muted"
          >
            <ChevronLeft className="size-3.5" /> Previous
          </button>
          <span>
            {index + 1} of {queue.length}
            {aheadOfSchedule && " · practising ahead of schedule"}
          </span>
        </div>
        {item.textTitle && <Badge>{item.textTitle}</Badge>}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge>{PROMPT_LABELS[item.promptType] ?? item.promptType}</Badge>
          <span className="text-xs text-foreground-muted">{MODE_LABELS[item.mode]}</span>
          {item.locationRef && (
            <span className="text-xs text-foreground-muted">· {item.locationRef}</span>
          )}
        </div>
        {item.question ? (
          <>
            <p className="font-serif text-base text-foreground leading-relaxed mb-1">{item.question}</p>
            <p className="text-xs text-foreground-muted mb-4">Card: {item.cardTitle}</p>
          </>
        ) : (
          <p className="font-serif text-base text-foreground mb-4">{item.cardTitle}</p>
        )}

        {outcome?.kind === "skipped" && (
          <p className="text-xs text-foreground-muted mb-3">
            You skipped this earlier. It&rsquo;s still open — do it now, or skip it again.
          </p>
        )}

        {/* Cloze as an opt-in hint, not the default. Free recall from nothing is
            the harder and more durable retrieval; the gapped frame is the step
            down when she's stuck, before giving up and seeing the answer. */}
        {!revealed && hintShown && cloze && cloze.blankCount > 0 && (
          <div className="rounded-lg bg-surface-muted p-3 mb-3">
            <p className="text-[11px] font-medium text-foreground-muted mb-1.5">Hint — fill the gaps</p>
            <p className="font-serif text-sm leading-loose">
              {cloze.tokens.map((tok, i) => (
                <span key={i}>
                  {tok.blank ? (
                    <span className="inline-block border-b border-foreground-muted/50 align-baseline" style={{ width: `${Math.max(2.5, tok.text.length * 0.55)}em` }} />
                  ) : (
                    tok.text
                  )}{" "}
                </span>
              ))}
            </p>
          </div>
        )}

        <textarea
          value={response}
          onChange={(e) => update({ response: e.target.value })}
          placeholder={
            item.mode === "recall"
              ? "Write the quotation out before you check…"
              : "Write your answer out in full. Don't stop at the evidence — say what it does."
          }
          rows={item.mode === "recall" ? 5 : 8}
          // Locked once revealed: what's saved should be what she wrote before
          // seeing the answer or her last attempt, not a corrected version.
          readOnly={revealed}
          className="w-full rounded-md border border-border px-3 py-2 text-sm mb-3"
        />

        {!revealed ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              // In produce mode the whole exercise is the writing, so there's
              // nothing to move on to until something has been written. Recall
              // stays ungated: checking a quotation you've blanked on is fine.
              disabled={item.mode === "produce" && !written}
              onClick={reveal}
            >
              {item.mode === "recall"
                ? written
                  ? "Check the quotation"
                  : "Show me the answer"
                : hasPrevious
                  ? "Done — show my last attempt"
                  : "Done writing"}
            </Button>
            {hintAvailable && !hintShown && (
              <Button variant="ghost" onClick={() => update({ hintShown: true })}>
                Show a hint
              </Button>
            )}
            {/* Skipping a writing prompt is a choice about time, not a signal
                about knowledge, so it records no result. Offered only while the
                box is empty: once she's written anything, Done saves it — a
                stuck attempt is still worth keeping for next time's comparison. */}
            {item.mode === "produce" && !written && (
              <>
                <span className="text-xs text-foreground-muted">
                  Write something first — this one can&rsquo;t be checked by reading it.
                </span>
                <Button variant="ghost" className="ml-auto" onClick={skip}>
                  Skip for now
                </Button>
              </>
            )}
          </div>
        ) : item.mode === "recall" ? (
          <div className="rounded-lg bg-surface-muted p-3 mb-4 space-y-2">
            {item.quoteText && (
              <>
                <p className="text-[11px] font-medium text-foreground-muted">The answer</p>
                <p className="text-base italic font-serif text-foreground">
                  &ldquo;{item.quoteText}&rdquo;
                  {item.speakerOrNarrator && (
                    <span className="not-italic text-sm text-foreground-muted"> — {item.speakerOrNarrator}</span>
                  )}
                </p>
              </>
            )}
            {item.studentExplanation && (
              <div>
                <p className="text-[11px] font-medium text-foreground-muted mb-1">Your notes</p>
                <p className="text-sm text-foreground-muted">{item.studentExplanation}</p>
              </div>
            )}
          </div>
        ) : (
          /* Produce mode: no answer key exists, so nothing here is presented as
             one. Her earlier attempts come first — they're the comparison the
             rating below actually asks about. */
          <div className="mb-4 space-y-3">
            {hasPrevious ? (
              <div className="rounded-lg border border-border bg-surface-muted p-3 space-y-3">
                <p className="text-[11px] font-medium text-foreground-muted flex items-center gap-1.5">
                  <PenLine className="size-3" />
                  What you wrote before — read yours again, then compare
                </p>
                {item.previousAttempts.map((prev, i) => (
                  <div key={i} className={i > 0 ? "border-t border-border pt-3" : undefined}>
                    <p className="text-[11px] text-foreground-muted mb-1">{friendlyDate(prev.reviewedAt)}</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{prev.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-surface-muted p-3">
                <p className="text-sm text-foreground-muted">
                  First time on this one, so there&rsquo;s nothing to compare against yet. What
                  you&rsquo;ve just written is saved — next time it&rsquo;ll be here.
                </p>
              </div>
            )}

            {item.studentExplanation && (
              <details className="text-sm">
                <summary className="text-xs text-foreground-muted cursor-pointer hover:text-foreground">
                  Your notes on the card
                </summary>
                <p className="text-sm text-foreground-muted mt-2 whitespace-pre-wrap">
                  {item.studentExplanation}
                </p>
              </details>
            )}
          </div>
        )}

        {/* Revealing a quotation with nothing written is an honest "didn't get
            it", not a skip: a skip would leave the schedule alone, so the line
            she couldn't recall wouldn't come back any sooner. No rating to
            choose — there was no attempt to judge. */}
        {finished ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-foreground-muted">
              {outcome.summary}. This one&rsquo;s finished — you can look back at it, but not answer or rate it again.
            </p>
            <Button variant="outline" onClick={() => setIndex((i) => i + 1)}>
              Next
            </Button>
          </div>
        ) : revealed && gaveUp ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-foreground-muted">
              Counted as not recalled — it&rsquo;ll come round again next time you practise.
            </p>
            <Button variant="outline" onClick={() => rate("again", "You showed the answer, so it counted as not recalled")}>
              Next
            </Button>
          </div>
        ) : revealed ? (
          <div>
            <p className="text-xs text-foreground-muted mb-2">{ratingQuestion}</p>
            <div className={`grid gap-2 ${ratings.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
              {ratings.map((r) => (
                <button
                  key={r.result}
                  onClick={() => rate(r.result, `You rated it “${r.label}”`)}
                  className={`rounded-md border px-2 py-2.5 text-sm font-medium transition-colors ${r.className}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
