"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { CARD_TYPE_LABELS } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

export function PracticeFilters({
  texts,
  sections,
  types,
  tags,
}: {
  texts: Option[];
  sections: Option[];
  types: string[];
  tags: Option[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    // Changing text invalidates any section range chosen for the old text.
    if (key === "text") {
      next.delete("from");
      next.delete("to");
    }
    next.delete("all");
    router.push(`/practice?${next.toString()}`);
  }

  const selectClass =
    "w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm";

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <p className="text-xs font-medium text-foreground-muted">What do you want to practise?</p>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-foreground-muted mb-1">Text</span>
          <select value={params.get("text") ?? ""} onChange={(e) => setParam("text", e.target.value)} className={selectClass}>
            <option value="">All texts</option>
            {texts.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs text-foreground-muted mb-1">Card type</span>
          <select value={params.get("type") ?? ""} onChange={(e) => setParam("type", e.target.value)} className={selectClass}>
            <option value="">Everything</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {CARD_TYPE_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sections.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs text-foreground-muted mb-1">From section</span>
            <select value={params.get("from") ?? ""} onChange={(e) => setParam("from", e.target.value)} className={selectClass}>
              <option value="">Start of text</option>
              {sections.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-foreground-muted mb-1">To section</span>
            <select value={params.get("to") ?? ""} onChange={(e) => setParam("to", e.target.value)} className={selectClass}>
              <option value="">End of text</option>
              {sections.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <label className="block">
        <span className="block text-xs text-foreground-muted mb-1">Theme or character (tag)</span>
        <select value={params.get("tag") ?? ""} onChange={(e) => setParam("tag", e.target.value)} className={selectClass}>
          <option value="">Any</option>
          {tags.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      {(params.get("text") || params.get("type") || params.get("tag") || params.get("from") || params.get("to")) && (
        <button onClick={() => router.push("/practice")} className="text-xs text-primary hover:underline">
          Clear filters
        </button>
      )}

      {params.get("from") || params.get("to") ? (
        <p className="text-[11px] text-foreground-muted">
          Section filters only match cards pinned to a specific scene or chapter — themes and characters aren&rsquo;t.
        </p>
      ) : null}
    </div>
  );
}
