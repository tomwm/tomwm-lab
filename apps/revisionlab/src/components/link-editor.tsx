"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCardLink, deleteCardLink } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { RELATION_LABELS } from "@/lib/utils";
import { RELATIONS, CARD_TYPES, type Relation, type CardType } from "@/db/schema";
import { CARD_TYPE_LABELS } from "@/lib/utils";
import { X } from "lucide-react";

export interface LiteCard {
  id: string;
  title: string;
  type: CardType;
  textTitle?: string | null;
}

interface ExistingLink {
  id: string;
  relation: string;
  explanation: string | null;
  other: { id: string; title: string };
  direction: "outgoing" | "incoming";
}

export function LinkEditor({
  cardId,
  sameTextCandidates,
  otherCandidates,
  existing,
  readOnly = false,
}: {
  cardId: string;
  sameTextCandidates: LiteCard[];
  otherCandidates: LiteCard[];
  existing: ExistingLink[];
  /** Read view shows the relationships as content; the controls for changing
   *  them live behind Edit, like every other mutation on the page. */
  readOnly?: boolean;
}) {
  const [targetId, setTargetId] = useState("");
  const [relation, setRelation] = useState<Relation>("supports");
  const [explanation, setExplanation] = useState("");
  const [includeOtherTexts, setIncludeOtherTexts] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const pool = includeOtherTexts ? [...sameTextCandidates, ...otherCandidates] : sameTextCandidates;
  const grouped = CARD_TYPES.map((type) => ({
    type,
    options: pool.filter((c) => c.type === type && c.id !== cardId),
  })).filter((g) => g.options.length > 0);

  function addLink() {
    if (!targetId) return;
    startTransition(async () => {
      await createCardLink(cardId, targetId, relation, explanation.trim() || null);
      setTargetId("");
      setExplanation("");
      router.refresh();
    });
  }

  function removeLink(id: string) {
    startTransition(async () => {
      await deleteCardLink(id);
      router.refresh();
    });
  }

  if (readOnly && existing.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        No connections yet — add one from Edit.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {existing.length > 0 && (
        <ul className="space-y-2">
          {existing.map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-2 rounded-lg border border-border bg-surface p-3 text-sm">
              <div>
                <p>
                  {l.direction === "outgoing" ? (
                    <>
                      <span className="text-foreground-muted">{RELATION_LABELS[l.relation]}</span>{" "}
                      <span className="font-medium">{l.other.title}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{l.other.title}</span>{" "}
                      <span className="text-foreground-muted">{RELATION_LABELS[l.relation]}</span> this card
                    </>
                  )}
                </p>
                {l.explanation && <p className="text-foreground-muted mt-1">{l.explanation}</p>}
              </div>
              {!readOnly && (
                <button onClick={() => removeLink(l.id)} disabled={pending} className="text-foreground-muted hover:text-danger shrink-0">
                  <X className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
      <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
        <div className="grid sm:grid-cols-2 gap-2">
          <select
            value={relation}
            onChange={(e) => setRelation(e.target.value as Relation)}
            className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm"
          >
            {RELATIONS.map((r) => (
              <option key={r} value={r}>
                this card {RELATION_LABELS[r]}…
              </option>
            ))}
          </select>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm"
          >
            <option value="">Choose a card…</option>
            {grouped.map((g) => (
              <optgroup key={g.type} label={CARD_TYPE_LABELS[g.type]}>
                {g.options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                    {includeOtherTexts && c.textTitle ? ` (${c.textTitle})` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <input
            type="checkbox"
            checked={includeOtherTexts}
            onChange={(e) => {
              setIncludeOtherTexts(e.target.checked);
              setTargetId("");
            }}
          />
          Include cards from other texts (for comparisons)
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain the connection in your own words"
          rows={2}
          className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
        />
        <Button size="sm" onClick={addLink} disabled={!targetId || pending}>
          Add connection
        </Button>
      </div>
      )}
    </div>
  );
}
