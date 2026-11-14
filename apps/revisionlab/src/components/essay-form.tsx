"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitEssay } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { wordCount } from "@/lib/utils";

interface TextOption {
  id: string;
  title: string;
}

export interface EssayFormInitial {
  questionText?: string;
  questionType?: string;
  marksAvailable?: number | null;
  assessmentObjectives?: string;
  textIds?: string[];
  extractText?: string;
}

export function EssayForm({
  texts,
  parentEssayId,
  initial,
}: {
  texts: TextOption[];
  parentEssayId?: string;
  initial?: EssayFormInitial;
}) {
  const [questionText, setQuestionText] = useState(initial?.questionText ?? "");
  const [questionType, setQuestionType] = useState(initial?.questionType ?? "");
  const [marksAvailable, setMarksAvailable] = useState(initial?.marksAvailable != null ? String(initial.marksAvailable) : "");
  const [aos, setAos] = useState(initial?.assessmentObjectives ?? "");
  const [selectedTextIds, setSelectedTextIds] = useState<string[]>(initial?.textIds ?? []);
  const [extractText, setExtractText] = useState(initial?.extractText ?? "");
  const [timed, setTimed] = useState(false);
  const [openBook, setOpenBook] = useState(true);
  const [completedWithHelp, setCompletedWithHelp] = useState(false);
  const [minutesTaken, setMinutesTaken] = useState("");
  const [submittedText, setSubmittedText] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggleText(id: string) {
    setSelectedTextIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  function submit() {
    if (!questionText.trim() || !submittedText.trim() || selectedTextIds.length === 0) return;
    startTransition(async () => {
      const id = await submitEssay({
        parentEssayId: parentEssayId ?? null,
        questionText: questionText.trim(),
        questionType: questionType.trim() || null,
        marksAvailable: marksAvailable ? Number(marksAvailable) : null,
        assessmentObjectives: aos.trim() || null,
        textIds: selectedTextIds,
        extractText: extractText.trim() || null,
        timed,
        openBook,
        completedWithHelp,
        minutesTaken: minutesTaken ? Number(minutesTaken) : null,
        submittedText: submittedText.trim(),
      });
      router.push(`/essays/${id}`);
    });
  }

  return (
    <div className="space-y-4">
      <Field label="Text(s) this essay is about">
        <div className="flex flex-wrap gap-2">
          {texts.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleText(t.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selectedTextIds.includes(t.id) ? "bg-primary text-primary-foreground border-primary" : "border-border bg-surface"
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Exact question">
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </Field>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Question type / component (optional)">
          <input value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="e.g. Component 1, Section A" />
        </Field>
        <Field label="Marks available (optional)">
          <input value={marksAvailable} onChange={(e) => setMarksAvailable(e.target.value)} type="number" className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="Leave blank if unsure" />
        </Field>
        <Field label="AOs targeted (optional)">
          <input value={aos} onChange={(e) => setAos(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm" placeholder="e.g. AO1, AO2, AO5" />
        </Field>
      </div>

      <Field label="Extract given with the question (optional)">
        <textarea value={extractText} onChange={(e) => setExtractText(e.target.value)} rows={3} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
      </Field>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} /> Timed</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={openBook} onChange={(e) => setOpenBook(e.target.checked)} /> Open-book</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={completedWithHelp} onChange={(e) => setCompletedWithHelp(e.target.checked)} /> Completed with some help</label>
        <label className="flex items-center gap-1.5">
          Minutes taken
          <input value={minutesTaken} onChange={(e) => setMinutesTaken(e.target.value)} type="number" className="w-16 rounded-md border border-border px-2 py-1 text-sm" />
        </label>
      </div>

      <Field label={`Your essay or paragraph (${wordCount(submittedText)} words)`}>
        <textarea
          value={submittedText}
          onChange={(e) => setSubmittedText(e.target.value)}
          rows={16}
          className="w-full rounded-md border border-border px-3 py-2 text-sm font-serif leading-relaxed"
        />
      </Field>

      <Button onClick={submit} disabled={pending || !questionText.trim() || !submittedText.trim() || selectedTextIds.length === 0}>
        {pending ? "Marking…" : "Submit for feedback"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-foreground-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
