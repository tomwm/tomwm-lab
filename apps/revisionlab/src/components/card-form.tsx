"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCard, updateCard, type CardInput } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { CARD_TYPE_LABELS } from "@/lib/utils";
import { CARD_TYPES, type CardType } from "@/db/schema";

export interface SectionOption {
  id: string;
  locationRef: string;
  title: string;
}

export interface CardFormValues {
  id?: string;
  type: CardType;
  title: string;
  locationRef: string;
  quoteText: string;
  speakerOrNarrator: string;
  studentExplanation: string;
  sourceNote: string;
  confidence: "solid" | "tentative" | "needs_checking";
  tags: string;
  /** Sections of the text this card relates to. */
  structureNodeIds: string[];
}

const EMPTY: CardFormValues = {
  type: "evidence",
  title: "",
  locationRef: "",
  quoteText: "",
  speakerOrNarrator: "",
  studentExplanation: "",
  sourceNote: "",
  confidence: "tentative",
  tags: "",
  structureNodeIds: [],
};

export function CardForm({
  textId,
  textSlug,
  initial,
  lockType,
  existingTags = [],
  sections = [],
  onSaved,
}: {
  textId: string;
  textSlug: string;
  initial?: CardFormValues;
  lockType?: boolean;
  /** Sections of this text, offered for binding. */
  sections?: SectionOption[];
  /** Tags already in use, most-used first — offered as suggestions so the same
   *  idea doesn't fragment across #power / #authority / #order. */
  existingTags?: { tag: string; count: number }[];
  /** Called instead of navigating, when the form is an inline edit that should
   *  hand back to a read view on the same page. */
  onSaved?: () => void;
}) {
  const [values, setValues] = useState<CardFormValues>(initial ?? EMPTY);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function set<K extends keyof CardFormValues>(key: K, val: CardFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  // Must read the *current* list, not the one captured at render: React batches
  // state updates, so two quick toggles would otherwise both start from the
  // same stale array and the second would discard the first.
  function toggleSection(id: string) {
    setValues((v) => ({
      ...v,
      structureNodeIds: v.structureNodeIds.includes(id)
        ? v.structureNodeIds.filter((i) => i !== id)
        : [...v.structureNodeIds, id],
    }));
  }

  function submit() {
    const input: CardInput = {
      type: values.type,
      title: values.title.trim(),
      primaryTextId: textId,
      locationRef: values.locationRef.trim() || null,
      quoteText: values.quoteText.trim() || null,
      speakerOrNarrator: values.speakerOrNarrator.trim() || null,
      studentExplanation: values.studentExplanation.trim() || null,
      sourceNote: values.sourceNote.trim() || null,
      confidence: values.confidence,
      tags: values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      structureNodeIds: values.structureNodeIds,
    };

    startTransition(async () => {
      if (initial?.id) {
        await updateCard(initial.id, { ...input, editSummary: "Edited via card form" });
        if (onSaved) onSaved();
        else router.push(`/texts/${textSlug}/cards/${initial.id}`);
      } else {
        const id = await createCard(input);
        router.push(`/texts/${textSlug}/cards/${id}`);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Card type">
          <select
            disabled={lockType}
            value={values.type}
            onChange={(e) => set("type", e.target.value as CardType)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm disabled:opacity-60"
          >
            {CARD_TYPES.map((t) => (
              <option key={t} value={t}>
                {CARD_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location reference (for citing — e.g. lines, page)">
          <input
            value={values.locationRef}
            onChange={(e) => set("locationRef", e.target.value)}
            placeholder="e.g. Ch. 11, Act 3 Scene 2"
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </Field>
      </div>

      {sections.length > 0 && (
        <div>
          <span className="block text-xs font-medium text-foreground-muted mb-1">
            Where in the text? Pick any sections this card relates to — a quotation usually sits in one, a theme in several,
            a piece of context often in none.
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sections.map((sec) => {
              const on = values.structureNodeIds.includes(sec.id);
              return (
                <button
                  key={sec.id}
                  type="button"
                  title={sec.title}
                  onClick={() => toggleSection(sec.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-foreground-muted hover:border-primary/40"
                  }`}
                >
                  {sec.locationRef}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Field label="Title">
        <input
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="A short, specific title"
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </Field>

      {values.type === "evidence" && (
        <>
          <Field label="Exact quotation (leave blank if you need to check it against your edition)">
            <textarea
              value={values.quoteText}
              onChange={(e) => set("quoteText", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border px-3 py-2 text-sm font-serif italic"
            />
          </Field>
          <Field label="Speaker / narrator">
            <input
              value={values.speakerOrNarrator}
              onChange={(e) => set("speakerOrNarrator", e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </Field>
        </>
      )}

      <Field label="Your explanation, in your own words">
        <textarea
          value={values.studentExplanation}
          onChange={(e) => set("studentExplanation", e.target.value)}
          rows={5}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </Field>

      {(values.type === "context" || values.type === "performance") && (
        <Field label="Source">
          <input
            value={values.sourceNote}
            onChange={(e) => set("sourceNote", e.target.value)}
            placeholder="Where this comes from"
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
        </Field>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="How sure are you?">
          <select
            value={values.confidence}
            onChange={(e) => set("confidence", e.target.value as CardFormValues["confidence"])}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
          >
            <option value="solid">Confident</option>
            <option value="tentative">Tentative</option>
            <option value="needs_checking">Needs checking</option>
          </select>
        </Field>
        <Field label="Tags (comma separated)">
          <TagInput
            value={values.tags}
            onChange={(v) => set("tags", v)}
            existingTags={existingTags}
          />
        </Field>
      </div>

      <Button onClick={submit} disabled={pending || !values.title.trim()}>
        {pending ? "Saving…" : initial?.id ? "Save changes" : "Create card"}
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

/**
 * Comma-separated tag entry with suggestions from tags already in use.
 * Tag fragmentation is the main failure mode of a tag system maintained by one
 * person over two years — suggesting what already exists is the cheapest fix.
 */
function TagInput({
  value,
  onChange,
  existingTags,
}: {
  value: string;
  onChange: (value: string) => void;
  existingTags: { tag: string; count: number }[];
}) {
  const parts = value.split(",");
  const current = (parts[parts.length - 1] ?? "").trim().toLowerCase();
  const chosen = new Set(
    parts.slice(0, -1).map((p) => p.trim().toLowerCase()).filter(Boolean)
  );

  const suggestions = existingTags
    .filter((t) => !chosen.has(t.tag.toLowerCase()))
    .filter((t) => (current ? t.tag.toLowerCase().includes(current) : true))
    .slice(0, 8);

  function applySuggestion(tag: string) {
    const kept = parts.slice(0, -1).map((p) => p.trim()).filter(Boolean);
    onChange([...kept, tag].join(", ") + ", ");
  }

  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="power, gender"
        className="w-full rounded-md border border-border px-3 py-2 text-sm"
      />
      {suggestions.length > 0 && (
        <div className="mt-1.5">
          <span className="text-[11px] text-foreground-muted mr-1.5">
            {current ? "Matching:" : "Already used:"}
          </span>
          <span className="inline-flex flex-wrap gap-1 align-middle">
            {suggestions.map((t) => (
              <button
                key={t.tag}
                type="button"
                onClick={() => applySuggestion(t.tag)}
                className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] text-foreground-muted hover:border-primary/40 hover:text-foreground"
              >
                #{t.tag} <span className="opacity-60">{t.count}</span>
              </button>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}
