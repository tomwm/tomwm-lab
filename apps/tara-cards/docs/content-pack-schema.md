# Content pack format

A content pack is a single JSON file. It is validated by
`src/content/schema.ts` (Zod) and `src/content/validate.ts` (the checks that need
more than a shape). Import one from Settings → Content.

Packs are **re-validated on every load**, not only at import.

## Shape

```jsonc
{
  "packFormatVersion": 1,
  "id": "tsa-2020-s1",
  "name": "TSA 2020 Section 1",
  "version": 1,
  "createdAt": "2026-09-17",
  "description": "",
  "sources": [ /* Source */ ],
  "questions": [ /* Question */ ],
  "writingPrompts": [ /* WritingPrompt */ ]
}
```

### Source

```jsonc
{
  "id": "tsa-2020-s1",
  "exam": "TSA",
  "year": "2020",
  "section": "Section 1",
  "title": "2020 TSA Section 1",
  "paperUrl": "https://…/TSA-2020-Section-1-Question-Paper.pdf",
  "keyUrl": "https://…/TSA-2020-Section-1-Answer-Key.pdf",
  "retrievedAt": "2026-09-17",           // YYYY-MM-DD, when a human last confirmed the URL
  "version": null,                        // version marker or content hash, if the provider gives one
  "attribution": "UAT-UK / Cambridge Assessment Admissions Testing",
  "contentUse": "link-only",              // link-only | interactive-approved | unknown
  "importStatus": "not-imported",         // not-imported | partially-imported | imported
  "note": "Question paper, answer key and official explained answers are published."
}
```

`contentUse` is the gate. A question may only be rendered in-app if its source is
`interactive-approved`. `unknown` is treated as `link-only`: public reachability
is not a redistribution licence, and the validator rejects a pack that tries to
render content from a source that is not approved.

### Question

```jsonc
{
  "id": "tsa-2020-s1-q01",               // stable: exam-year-section-question
  "version": 1,                           // bump on any content change; attempts pin what they saw
  "componentId": "critical-thinking",     // critical-thinking | problem-solving
  "primarySkillId": "ct-assumptions",     // exactly one — this is what reports count it under
  "secondaryTags": ["percentages"],       // technique tags and/or other skill ids, for discovery only
  "locator": {
    "sourceId": "tsa-2020-s1",
    "paper": "Section 1",
    "questionNumber": 1,
    "page": 3,
    "keyLocator": "Answer key, row 1"     // where in the key this answer was read from
  },
  "blocks": [ /* ContentBlock[] — the stem */ ],
  "options": [
    { "id": "opt-a", "label": "A", "blocks": [ /* ContentBlock[] */ ] }
    // at least two; ids must be unique and are what marking references
  ],
  "answerOptionId": "opt-c",              // null when no verified key exists — never guessed
  "answerVerification": "verified-key",   // verified-key | unverified | none
  "explanation": {
    "status": "official",                 // none | official | app-authored-reviewed | app-authored-draft
    "blocks": [ /* ContentBlock[] */ ],
    "distractors": [ { "optionId": "opt-a", "note": "Why this tempts you" } ],
    "method": "One transferable line.",
    "sourceNote": "From the published explained answers."
  },
  "flags": {
    "transcriptionChecked": true,
    "answerKeyChecked": true,
    "alignmentChecked": true,
    "assetsChecked": true
  },
  "availability": "interactive",          // interactive | link-only | quarantined
  "distributionMode": "interactive-approved",
  "duplicateGroupId": "grp-tsa-2020-q01", // shared by variants of the same question
  "reservedForMock": false,               // held out of ordinary practice
  "provenance": "official",               // official | app-fixture
  "quarantineReason": null
}
```

Option order is preserved exactly as printed in the source. Option **ids** are
what marking uses, so reordering the rendering can never change a recorded
answer.

### ContentBlock

```jsonc
{ "kind": "paragraph", "text": "…" }
{ "kind": "passage",   "text": "…", "label": "Passage" }
{ "kind": "list",      "ordered": false, "items": ["…"] }
{ "kind": "table",     "caption": "…", "headers": ["…"], "rows": [["…"]] }
{ "kind": "figure",    "alt": "…", "svg": "<svg …>", "caption": "…" }
```

Figures carry inline SVG so there are no missing binary assets, and `alt` is
required. Alt text must describe the **given** information without revealing the
solution: for a cumulative rainfall chart, give the readings, not which month was
wettest.

### WritingPrompt

```jsonc
{
  "id": "…", "version": 1,
  "provenance": "app-fixture",
  "locator": null,
  "statement": "…",
  "requirements": ["…"],                  // this prompt's own tasks, not boilerplate
  "coaching": {
    "status": "app-authored-reviewed",
    "approaches": [ { "heading": "…", "body": "…" } ],
    "counterpoints": ["…"],
    "checklist": ["…"]                    // specific to this prompt
  },
  "skillIds": ["wr-counterargument"],
  "availability": "interactive"
}
```

## Eligibility

An item enters interactive, scored practice only when **all** of these hold:

- `availability` is `interactive`
- `distributionMode` is `interactive-approved`, and its source's `contentUse`
  agrees
- `answerVerification` is `verified-key` and `answerOptionId` is set
- all four review flags are true

A verified key enables marking even with no explanation. The back then says
"Worked explanation not yet available" — it does not invent one.

## Import pipeline

1. **Identify** the source and its version; record `retrievedAt`.
2. **Extract** text and assets. PDF extraction is a preparation utility only; its
   output never goes straight into practice.
3. **Align** numbered items with the matching answer key, recording `keyLocator`.
4. **Review** figures and option ordering by hand.
5. **Map** each item to one current primary skill plus any secondary tags.
6. **Detect duplicates**: exact matches by normalised content hash; variants and
   reuses need a manually confirmed `duplicateGroupId`. Guide and sample overlaps
   should be tagged too.
7. **Record content-use status.** Unknown defaults to link-only.
8. **Approve** by setting the four flags. Only then does `availability` become
   `interactive`.

Never infer a missing official answer with a model. Preserve original wording
rather than rewriting an official item while keeping an official badge.

## Quarantine

Items that parse but cannot be trusted are quarantined rather than dropped, with
the reason stored and shown in Settings → Coverage. Triggers include a missing
diagram, a key that points at a non-existent option, an answer marked
key-verified with no answer, fewer than two options, duplicate option ids, a
figure with no alt text, and any unsigned review flag.

`src/content/fixtures/problem-solving.ts` contains `fx-ps-quarantined-01`, a
deliberately incomplete item kept so this path is visible in the running app.
