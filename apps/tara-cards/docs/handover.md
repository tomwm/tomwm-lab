# Handover

TARA Cards, built against the build specification v1.0 (17 September 2026).

## Setup

```bash
npm install            # from the monorepo root
npm run dev:tara-cards # http://localhost:5181/tara-cards/
npm -w apps/tara-cards run test
```

Not deployed. It is wired into the monorepo as a workspace with a `dev:` script
and a `.claude/launch.json` entry, but deliberately **not** added to `build.js`
or `vercel.json`, so nothing publishes it until you ask.

## Software completion vs question-bank completion

These are different things, and only one of them is done.

**The software is complete.** Every screen in the specification exists and
works: Today, Library (components → skills → questions), Practice (quick,
custom, diagnostic, timed module, full rehearsal, official links), Writing
(prompts, exercises, planning, drafting, review), Progress, Settings and the
coverage report.

**The question bank is not started.** All 25 practisable questions and all 3
writing prompts are *development fixtures* — original content written for this
app to prove the machinery. None of the 37 official past papers has been
imported.

That was a judgement call made during the build, and it is worth your attention:

> UAT-UK's preparation page states that "the sharing of test content either
> during or after the admissions cycle is strictly prohibited".

The specification already said unknown permission defaults to link-only. Having
read that line on the provider's own site, I set **every** official source to
`link-only` and imported none of them. The alternative — transcribing BMAT and
TSA questions into the app — is exactly what that sentence prohibits. If you
have a basis for using that content that I do not know about, the import
pipeline is built and documented; change `contentUse` to
`interactive-approved` on the relevant sources and the validator will let the
content through.

What you get instead for the official material is a **verified source manifest**:
37 papers (BMAT Section 1 2003–2023, TSA Section 1 2008–2023) plus the
specification, question guide, archive index and the provider's practice tests.
All 81 URLs were fetched and returned 200 on 17 September 2026
(`node scripts/verify-sources.mjs` re-checks them). Each paper card opens the
real PDF, links its answer key, and lets you record what you scored — labelled
self-reported, and kept out of the marked-practice figures.

## Update, 19 September 2026: official papers imported

At Tom's direction (personal use only), all 37 archive papers are imported with
`scripts/import_paper.py` into two packs in `content-packs/`:

| Pack | Questions | Critical Thinking | Problem Solving | Shown as images | Size |
| --- | --- | --- | --- | --- | --- |
| `tara-tsa.json` (TSA 2008–2023) | 800 | 406 | 394 | 242 | 12 MB |
| `tara-bmat.json` (BMAT 2003–2023) | 694 | 267 | 427 | 174 | 13 MB |

- Every question is marked from the official answer key; none is inferred.
- 34 BMAT questions are free-response or two-answer and were skipped — the app
  marks single-answer multiple choice only.
- Only TSA 2020 has official worked explanations; every other question shows the
  verified answer with "Worked explanation not yet available".
- Questions with tables, charts or diagrams, or whose text layer is unreadable,
  are shown as an image of the printed question. BMAT shared passages ("Questions
  8–11 refer to…") are attached to every question in their range and stored once.
- Skills are assigned automatically by `scripts/classify.py`. Checked against a
  hand mapping of TSA 2020 it got every component and every Critical Thinking
  skill right; Problem Solving sub-skills are approximate (46/50 exact).

`content-packs/` is gitignored and is fetched at runtime locally. For the
deployed site, import the two files through Settings → Content in each browser.

### The TARA question guide

Read in full on 19 September 2026, alongside the content specification. It
corrected the app in four places, all now fixed:

- The Writing Task is officially **40 minutes** (the app had called it a preset).
- Prompts follow a fixed three-part task — explain the statement, argue against
  it, say how far you agree — so the fixture prompts now use exactly that.
- UAT-UK's own recommendations for the essay replace the app's checklist on the
  official prompt, and planning advice now cites its 5–10 minutes.
- TARA questions always have five options, so timed modules and the full
  rehearsal now use five-option questions only (the ~145 BMAT items with 4 or
  6–8 options remain in ordinary practice).

`scripts/import_guide.py` imports its ten worked examples, one per question
type, each with the official explanation, plus the sample Writing Task prompt,
into `content-packs/tara-guide.json`. Skill pages now show the guide's official
name for each question type.

## Update, 19 September 2026: deployed with all questions, behind a passcode

Live at **https://lab.tomwm.co.uk/tara-cards/** (Vercel project `tara-cards`,
proxied by a rewrite in the root `vercel.json`). The build includes all three
question packs; `middleware.ts` checks every request, so without the passcode
the page and the question files return the login page (401). Verified from
outside after deploy. Deploy again with `npm run deploy` from `apps/tara-cards`
— never via Git, since the packs are gitignored and the repo is public. A root
`.vercelignore` keeps the packs out of the main lab site's upload.

## Content coverage as originally built

| | Count |
| --- | --- |
| Questions stored | 26 |
| Practisable (verified key + all four review flags) | 25 — 14 Critical Thinking, 11 Problem Solving |
| Of those, official | **0** |
| Of those, development fixtures | 25 |
| Quarantined (figure missing) | 1 |
| Without a worked explanation | 2 (one quarantined, one deliberately key-only) |
| Duplicate groups | 25 (one group holds two variants of the same question) |
| Held out for rehearsal | 2 |
| Writing prompts | 3 |
| Sources listed | 44 — 43 official and link-only, 1 fixture source |

Fixtures cover all 7 Critical Thinking skills and all 3 Problem Solving skills,
plus the three writing interactions (planning, drafting, review). Settings →
Coverage shows these numbers live and lists every quarantined item with its
reason.

## Acceptance criteria

| # | Criterion | State |
| --- | --- | --- |
| 1 | Keyboard-only: component → skill → question → reveal | **Met.** Focus order and link activation checked in the browser; radio-group arrow selection and button activation covered by `QuestionCard.test.tsx`. See the note below. |
| 2 | Same question via two skills shares one history, no double counting | **Met.** `fx-ct-assumption-01` and `fx-ct-weaken-01` each appear under two skills, badged "Also trains this"; scored under the primary skill only. Tested. |
| 3 | Reveal records exposure but no scored attempt; later correct = repeat | **Met.** Tested and checked in the browser. |
| 4 | Marking uses the verified key, persists exactly once, survives refresh; missing explanations handled honestly | **Met.** `saveAttempt` is idempotent per session and question; `fx-ps-no-explanation-01` shows the "Worked explanation not yet available" path. |
| 5 | Unseen-only never quietly includes seen items | **Met.** Returns a shorter set and says so. Tested. |
| 6 | Duplicate groups and held-out mock content respected | **Met.** Tested in selection and rehearsal picking. |
| 7 | Refresh, tab closure, multiple tabs and expiry cannot reset a timed session; a submitted module cannot reopen | **Met.** Verified in the browser by winding the persisted deadline into the past: the module expired, recorded the answers as they stood, and locked. Two tabs on the same session: the second is refused and offered a deliberate takeover. |
| 8 | Rehearsal keeps separate sequential deadlines, releases nothing early | **Met in code, not exercised end to end.** Staging, cascading expiry and the writing stage are unit-tested; the running app cannot start a rehearsal because there are 14 and 11 approved questions against the 22 each component needs — which is criterion 10 doing its job. |
| 9 | Essays autosave, preserve revisions, count words consistently, handle oversized pastes and expiry, recover after reopening | **Met.** Verified in the browser: a 760-word draft flagged over the limit with submission blocked, then on expiry a 750-word submitted snapshot ending at the right word with the full text archived. |
| 10 | Rehearsal cannot start without material; shortage names what is missing | **Met.** "Critical Thinking: 14 of 22 approved questions available." and "Problem Solving: 11 of 22". |
| 11 | Progress separates fresh and repeated, shows sample sizes, invents no scores | **Met.** Fixture attempts are excluded by default with a visible explanation and an opt-in. |
| 12 | Malformed packs rejected with actionable errors; missing figures or keys cannot enter scored practice | **Met.** Field-level errors; quarantine with stated reasons. Tested. |
| 13 | Backup export/import round-trips without corrupting content references; destructive import needs concrete confirmation | **Met.** Merge/replace preview with per-table counts and collisions; replace requires typing `REPLACE`. Round trip tested. |
| 14 | AI failure never loses a draft; absent AI leaves a complete study experience | **Half met, honestly.** With no provider configured — the shipped state — every writing feature works and says so. The send-and-recover path is **not implemented**: there is a settings field for an endpoint and the data model for feedback records, but no request, no validation of returned excerpts and therefore no failure path to test. See "Not built" below. |
| 15 | Source-linked cards do not imply local import or verified results | **Met.** Every source is badged "link only"; recorded results are badged "self-reported". |
| 16 | Mobile and desktop inspected; nothing clipped | **Met.** Checked at 360px and desktop. One overflow found on the sources page and fixed; tables scroll inside their own container. |

### Note on criterion 1

The browser automation available here cannot synthesise the default activation
of a `<button>` from a key press — a plain `<button>` with an `onclick`, focused,
receives zero clicks from its Enter and Space. I confirmed that with a probe
element before concluding anything about the app. So keyboard operation is
evidenced in two halves: link activation, focus order and arrow-key selection
within the radio group were driven in the real browser; button activation is
driven by `user-event` in the jsdom suite. Every control is a native `<button>`,
`<a>`, `<input>` or `<select>`, so there is no custom key handling to go wrong.

## Bugs found and fixed during the build

Recording these because each one would have quietly produced wrong numbers:

1. **Browsing a question then answering it counted as a repeat.** The question
   page passed a live-updating exposure set, so the page's own "prompt viewed"
   exposure disqualified the attempt it was about to record. Now the exposed set
   is snapshotted before the card mounts.
2. **A module that expired while the tab was closed recorded no attempts.** The
   session page redirected to the results before the runner could write them, so
   the score rendered but Progress saw nothing. `finaliseSession` now runs on
   submission, on reconciling an expiry and again when results open, and is
   idempotent.
3. **The cross-tab lock allowed two tabs on the same session** — the exact case
   it existed to prevent. Fixed, and the tab identity now lives in
   sessionStorage so a refresh reclaims its own lock instead of locking you out.
4. **Unanswered items were labelled "repeat practice".** Now "No answer given".
5. **Focus fell to `<body>` when the Check button unmounted.** It now moves
   deliberately to the revealed result, which is also announced in a live region
   that exists before the result does.

## Tests

124 tests across 12 files (`npm test`), covering grading, fresh/repeat and
exposure accounting, selection and its refusal to substitute, review scheduling,
timer reconciliation and cascading rehearsal stages, word-count boundaries,
draft persistence and truncation, backup round-trip, content validation and
quarantine, the cross-tab lock, and the attempt → reveal → remount flow through
the real component. None of them merely mirror component markup.

Manually inspected: keyboard focus order, the 360px layout on nine routes, a
table-heavy question, an SVG figure question, dark and light themes.

## Not built

- **AI essay feedback.** The endpoint setting and the `FeedbackRecord` shape are
  there; the request, the structured-output validation, the excerpt verification
  and the server endpoint are not. The UI states plainly that it is not
  configured rather than showing a dead button.
- **Pausing a timed attempt.** The training-mode setting and the `pausedMs`
  accounting exist in the domain and are respected by the clock, but no pause
  control is exposed in the runner yet.
- **A PDF extraction utility.** The pack format, validator and pipeline are
  documented; the extraction script is not written, and per the specification it
  should never publish unchecked output into practice anyway.

## Suggested next steps

1. Settle the content question. Either establish a basis for importing the
   archive papers, or accept the app as method guides plus source-linked
   practice plus fixtures — which is a genuinely useful thing on its own.
2. If importing: start with TSA 2020, which is the one paper with official
   explained answers as well as a key, so the explanation provenance path gets
   real content rather than app-authored text.
3. Write more fixtures for the thinner skills if you want the diagnostic and the
   rehearsal to be exercisable before any import happens; 22 per reasoning
   component is the threshold.
