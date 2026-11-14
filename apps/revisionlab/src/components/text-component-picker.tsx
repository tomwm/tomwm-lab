"use client";
import { useState, useTransition } from "react";
import { setTextAssessmentComponent } from "@/lib/actions";

export function TextComponentPicker({
  textId,
  value,
  note,
}: {
  textId: string;
  value: "exam" | "coursework" | null;
  note: string | null;
}) {
  const [current, setCurrent] = useState(value ?? "");
  const [noteVal, setNoteVal] = useState(note ?? "");
  const [pending, startTransition] = useTransition();

  function save(next: string, nextNote: string) {
    startTransition(() => {
      setTextAssessmentComponent(textId, (next || null) as "exam" | "coursework" | null, nextNote.trim() || null);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={current}
        disabled={pending}
        onChange={(e) => {
          setCurrent(e.target.value);
          save(e.target.value, noteVal);
        }}
        className="rounded-md border border-border bg-white px-2 py-1.5 text-sm"
      >
        <option value="">Unassigned</option>
        <option value="exam">Exam text</option>
        <option value="coursework">Coursework</option>
      </select>
      <input
        value={noteVal}
        onChange={(e) => setNoteVal(e.target.value)}
        onBlur={() => save(current, noteVal)}
        placeholder="Optional note"
        className="flex-1 min-w-[160px] rounded-md border border-border px-2 py-1.5 text-sm"
      />
    </div>
  );
}
