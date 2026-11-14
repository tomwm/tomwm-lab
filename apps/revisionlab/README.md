# RevisionLab

An English Literature revision workspace for OCR A-level H472 (provisional — exams
expected summer 2028), built around four text workspaces: **Dracula**, **King Lear**,
**Beloved** and **Jerusalem**.

## What this is

Connected revision cards (scene, evidence, theme, character, context, interpretation,
comparison, performance/critical reading) linked by meaningful relationships
(supports / challenges / contrasts with / develops / foreshadows / provides context
for), viewed through a structure overview adapted to each text:

- **Dracula** — chapter list with narrator/POV per chapter.
- **King Lear** — acts/scenes with a Lear-plot / Gloucester-plot track filter.
- **Beloved** — toggle between narrative order and chronology, with chronology
  deliberately left unplaced where the novel itself keeps it uncertain.
- **Jerusalem** — acts, with quotations deliberately left blank (see below).

Plus retrieval practice (spaced repetition over cards), essay submission with AI
(or demo) marking, and the "develop this idea further" coaching loop.

## Quotation policy — read before adding content

- **Dracula** (1897) and **King Lear** (c.1606) are public domain. Short, very
  well-known lines are seeded as verified quotations.
- **Beloved** (1987) and **Jerusalem** (2009) are in copyright. The app does not
  reproduce their text beyond one short, famously-quoted line (Beloved's three-word
  opening). Evidence cards for these ship with the quote field intentionally blank —
  add exact quotations yourself from your own copy.
- Never invent a quotation, critic, page number, or historical fact. If you're not
  sure, mark the card `needs_checking` rather than guessing.

## Course configuration

OCR H472 is set as a **provisional** qualification. The full text list, poetry
selections, and which texts are exam vs. coursework have **not** been confirmed —
that assignment is left "Unassigned" in Settings until you set it. Verify against
the live OCR specification before relying on any AO weighting or mark scheme detail:

- [Specification](https://www.ocr.org.uk/qualifications/as-and-a-level/english-literature-h072-h472-from-2015/)
- [Assessment materials](https://www.ocr.org.uk/qualifications/as-and-a-level/english-literature-h072-h472-from-2015/assessment/)

## Stack

Next.js 15 (App Router) + TypeScript, Tailwind v4, Drizzle ORM over a local SQLite
file (`data/revisionlab.db`, gitignored). No user accounts — this is a personal,
single-user app; an optional shared passcode (`APP_PASSCODE`) gates access if
deployed somewhere public.

Essay marking uses the Anthropic (or optionally OpenAI) API server-side only — see
`.env.example`. Without a key configured, feedback is generated locally and clearly
labelled "Demonstration feedback — not a real assessment."

## Getting started

```bash
npm install
npm run db:push     # create the SQLite schema
npm run db:seed      # load the starter texts, cards and connections
npm run dev           # http://localhost:3012
```

## Backups

Settings → Backup downloads a full JSON export of every text, card, connection,
essay and piece of feedback.

## What's deliberately unfinished

- Poetry collections and the comparative topic aren't set up yet — add a text via
  the database/seed script once the course list is confirmed; the schema already
  supports a `poetry_collection` text type and `poems` structure mode.
- No teacher-feedback UI yet (schema has an `essayFeedback.source: "teacher"` path
  ready for it).
- No held-out marking evaluation harness yet (`aiConfigVersion` is recorded on every
  piece of AI feedback so this can be added without losing history).
