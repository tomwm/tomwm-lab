# TARA Cards

A personal study app for the three TARA components — Critical Thinking, Problem
Solving and Writing. Local-only, no account, no sync, no payments.

Not produced, endorsed or checked by UAT-UK.

## Run it

```bash
npm install            # from the monorepo root
npm run dev:tara-cards # http://localhost:5181/tara-cards/
```

Other scripts, from `apps/tara-cards`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, then build to `../../dist/tara-cards` |
| `npm test` | The full vitest suite |
| `npm run typecheck` | `tsc -b` with no emit |
| `node scripts/verify-sources.mjs` | Checks every URL in the source manifest still resolves |
| `node scripts/generate-sources.mjs scripts/papers.tsv` | Regenerates `src/content/sources.generated.ts` |

## What is actually in it

**The software is built. The question bank is not.** Every question you can
answer in the app is a *development fixture*: original content written to
demonstrate that marking, exposure tracking, review scheduling and reporting
work. None of the 37 official past papers has been imported.

That is a deliberate decision, not an omission. UAT-UK's preparation page states
that sharing test content during or after the admissions cycle is prohibited, so
every official source defaults to link-only and no official question text is
reproduced in this repository. Public reachability is not a redistribution
licence.

What the app does give you for the official material is a verified source
manifest: 37 papers plus the specification, question guide and the provider's own
practice tests, every URL checked and openable, with a place to record what you
scored when you work through one.

Settings → Coverage shows the current numbers at any time.

## Verified facts the app is built on

Checked 17 September 2026:

- Two 22-question multiple-choice modules, 40 minutes each, then one essay chosen
  from three prompts with a 750-word limit.
- No deduction for an incorrect multiple-choice answer.
- Unused module time does not carry over.
- Calculators, dictionaries and electronic spell-checkers are not permitted.
- UAT-UK reports the two reasoning scores separately (1.0–9.0) and passes the
  essay to participating universities **without scoring it**.
- The Writing Task is 40 minutes. Each prompt asks you to explain a statement,
  give a reasoned argument against it, and say how far you agree. UAT-UK
  recommends planning for 5 to 10 minutes. Every question has five options.

Sources: [TARA overview](https://esat-tmua.ac.uk/about-the-tests/tara/) ·
[Prepare](https://esat-tmua.ac.uk/prepare/) ·
[Archive](https://esat-tmua.ac.uk/tara-preparation-materials/) ·
[Content specification](https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/06/08142350/TARA_Content_Specification.pdf) ·
[Question guide](https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/06/08142344/TARA_Question_Guide.pdf)

Everything else — review intervals, status thresholds, the 60/40 practice mix —
is this app's product design, not an examination rule. The
app says so wherever it shows one.

## What it deliberately does not do

- No estimated 1–9 score, no admissions probability, no overall readiness figure.
- No mark for an essay, because the real test does not mark it either.
- No invented explanations. A question with a verified key but no written
  explanation says "Worked explanation not yet available".
- No self-rated "I knew it". A reveal is recorded as exposure and is never
  scored.
- No fake streaks, placeholder scores or sample progress.

## Where things live

```
src/
  content/    components, skills, source manifest, fixtures, pack schema + validator
  domain/     pure functions: marking, exposure, selection, review, timing, aggregation
  storage/    Dexie database, repository, cross-tab lock, backup
  features/   today · library · practice · writing · progress · settings
  ui/         primitives, cards, content-block renderer
docs/         architecture note, content-pack schema, handover
```

`docs/architecture.md` explains the boundaries. `docs/content-pack-schema.md` is
what you need to import real content. `docs/handover.md` is the state of the
build against the acceptance criteria.

## Deploying (with the questions, behind a passcode)

The deployed app contains all imported questions, so every request goes through
`middleware.ts` → `src/auth/gate.ts` before anything is served. Without the
passcode cookie, the page, its scripts and the question files all get the login
page (401). If `APP_PASSCODE` is not set, the site serves nothing (503).

The packs are gitignored because the repo is public, so deploy from this
machine with `npm run deploy` (from `apps/tara-cards`). It builds locally with
the packs, uploads only the built output, and then checks from outside that the
live page and a question file both return 401 without the passcode.

One-time setup: `vercel link` (a project called tara-cards) and
`vercel env add APP_PASSCODE production`. Changing the passcode signs every
device out. To test the gate locally first:
`npm run build && APP_PASSCODE=test npm run preview:gated`.

## Your data

Everything is stored in IndexedDB in this browser on this device. Clearing site
data, switching browser or using a private window loses it. Settings → Backup
exports versioned JSON and restores it with a merge/replace preview; essays also
export as plain text.
