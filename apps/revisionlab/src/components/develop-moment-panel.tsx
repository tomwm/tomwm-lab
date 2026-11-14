"use client";
import { useState, useTransition } from "react";
import { submitDevelopResponse, requestDevelopExample, saveDevelopMomentAsCard } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import type { developMoments } from "@/db/schema";

type Moment = typeof developMoments.$inferSelect;

const MOVE_LABELS: Record<string, string> = {
  implication: "Explain the implication",
  tension: "Explore a tension or contradiction",
  language_form: "Examine language, form or structure",
  alternative_reading: "Consider an alternative reading",
  audience_effect: "Consider the audience/reader effect",
  return_to_argument: "Return to your central argument",
};

export function DevelopMomentPanel({ moment, textIds }: { moment: Moment; textIds: string[] }) {
  const [response, setResponse] = useState(moment.studentResponse ?? "");
  const [saved, setSaved] = useState(false);
  const [example, setExample] = useState(moment.exampleText);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const [pending, startTransition] = useTransition();

  function saveResponse() {
    startTransition(async () => {
      await submitDevelopResponse(moment.id, response.trim());
      setSaved(true);
    });
  }

  function getExample() {
    startTransition(async () => {
      if (response.trim()) await submitDevelopResponse(moment.id, response.trim());
      const text = await requestDevelopExample(moment.id);
      setExample(text);
    });
  }

  function saveAsCard() {
    if (!cardTitle.trim() || !textIds[0]) return;
    startTransition(async () => {
      await saveDevelopMomentAsCard(moment.id, textIds[0], cardTitle.trim());
      setShowSaveForm(false);
    });
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
      <h3 className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
        <Lightbulb className="size-5 text-primary" /> Develop this idea further
      </h3>

      <blockquote className="text-sm italic text-foreground-muted border-l-2 border-primary/40 pl-3">
        &ldquo;{moment.essayExcerpt}&rdquo;
      </blockquote>

      <p className="text-sm text-foreground font-medium">{moment.promptQuestion}</p>
      <p className="text-xs text-foreground-muted">Suggested move: {MOVE_LABELS[moment.moveType] ?? moment.moveType}</p>

      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Have a go at extending your idea here…"
        rows={4}
        className="w-full rounded-md border border-border px-3 py-2 text-sm bg-white"
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={saveResponse} disabled={pending || !response.trim()}>
          {saved ? "Saved" : "Save my attempt"}
        </Button>
        <Button size="sm" variant="outline" onClick={getExample} disabled={pending}>
          {example ? "Get another example" : "Show me an example"}
        </Button>
      </div>

      {example && (
        <div className="rounded-lg bg-surface p-3 border border-border">
          <p className="text-xs font-semibold text-foreground-muted mb-1">Worked example (not a rewrite of your essay)</p>
          <p className="text-sm text-foreground">{example}</p>
        </div>
      )}

      {response.trim() && !showSaveForm && (
        <button className="text-sm text-primary hover:underline" onClick={() => setShowSaveForm(true)}>
          Turn this into a card for revision →
        </button>
      )}

      {showSaveForm && (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            placeholder="Title for the new interpretation card"
            className="flex-1 min-w-[200px] rounded-md border border-border px-3 py-2 text-sm"
          />
          <Button size="sm" onClick={saveAsCard} disabled={pending || !cardTitle.trim()}>
            Save card
          </Button>
        </div>
      )}
    </div>
  );
}
