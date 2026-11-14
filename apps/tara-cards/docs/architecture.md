# Architecture note

## The one rule

Selection, marking, timing, exposure classification, review scheduling and
aggregation are **pure functions** in `src/domain/`, with explicit inputs and no
access to storage, React or the clock beyond a `now` parameter. UI components
render them and persist their results; they never score anything themselves.

This is what makes the acceptance criteria testable. `src/domain/*.test.ts` runs
the whole of the reasoning layer without a browser.

## Layers

```
content/   →  what exists to study      (static + imported packs, validated)
domain/    →  what it means             (pure, deterministic, no I/O)
storage/   →  what the learner did      (Dexie / IndexedDB)
features/  →  what the learner sees     (React, per area)
ui/        →  how it looks              (primitives, tokens, card components)
```

Dependencies point downwards only. `domain/` imports nothing from `storage/` or
`features/`.

## Cards are views, not a data structure

There is no recursive generic `Card` object. A component card renders a
`StudyComponent`, a skill card renders a `Skill`, a question card renders a
`Question` plus that item's attempt history. The three behave differently on
purpose:

- **Skill cards open.** "Explore skill" navigates.
- **Question cards reveal.** "Try question" then "Reveal explanation" expands a
  panel in place, with a subtle transition — no 3D rotation, no fixed height, no
  hidden keyboard focus, and nothing that could leak an answer into a preview.
- **Writing prompts have no answer on the back.** Revealing shows several
  possible approaches, objections worth answering and a per-prompt checklist,
  all labelled app-authored, and marks the prompt as exposed.

## Identity and counting

A question has exactly **one** primary skill, which is what every report counts
it under, and any number of secondary tags for discovery. A question may be
listed under a second skill; it is still scored under its primary one, and the
skill page says so.

A question belongs to a **duplicate group**. Exposure, review scheduling and
freshness all key on the group, not the question id, so meeting one variant
means the other is never counted as fresh again. Exact duplicates are detected
by a normalised content hash; variants need a human-confirmed
`duplicateGroupId`, and the app reports unconfirmed matches rather than guessing.

Every attempt stores a **snapshot** of the skill, component, provenance and
question version at the time it was answered. Re-tagging content later cannot
rewrite history.

## Freshness

`freshFirstAttempt` is true only when all three hold:

1. the item's duplicate group was not exposed **before this session started**;
2. the learner submitted an answer before revealing;
3. no assistance was used.

The "before this session started" part matters. A session snapshots
`exposedGroupsAtStart` when it is created, so opening a question inside its own
answering session does not disqualify it, while having browsed it yesterday does.
The same snapshot is taken when a single question is opened from the library.

Only fresh first attempts appear in transfer figures. Repeat practice is reported
separately and never raises fresh accuracy.

## Time

Every timed stage stores an **absolute deadline**. Remaining time is always
derived from it; there is no counter that can be restarted by a refresh.

`reconcileSession(session, now)` is the single place this is resolved. It runs on
load, on focus, on visibility change and once a second, and it cascades: if the
laptop was shut during module one of a rehearsal, module one expires at its own
deadline, module two starts at that instant with its own independent deadline,
and it may expire too. A refresh cannot insert an unlimited break.

`finaliseSession` turns a finished module's saved answers into attempt records.
It runs on submission, on reconciling an expiry, and again when the results page
opens, and it is idempotent — so a module that expired while the tab was closed
still records exactly what was selected when the clock stopped.

Answers persist immediately on every selection. Essay drafts debounce by 700ms
and show saving / saved / error states, with a copy-and-download escape path if a
save fails.

A single active-session lock in IndexedDB, heartbeated every five seconds, stops
two tabs writing conflicting state to the same timed session. The second tab is
told plainly and can take over deliberately.

## Content and permission

`Source.contentUse` defaults to `link-only`, and `unknown` is treated as
link-only. The validator refuses a question marked `interactive-approved` whose
source is not, with the message that public reachability is not a redistribution
licence.

An item becomes practisable only when it has a verified answer key **and** all
four review flags are signed off (transcription, answer key, alignment, assets).
Anything else is quarantined with a stated reason rather than deleted, so the
coverage report can say what is missing. Missing answers are never inferred with
a model.

Content packs are re-validated on every load, not only at import, so a pack that
stops passing cannot quietly stay in use.

## Data versioning

Content and learner data version separately. Backups carry learner data only; the
import preview names attempts that refer to questions the current content does
not have, rather than dropping them silently.
