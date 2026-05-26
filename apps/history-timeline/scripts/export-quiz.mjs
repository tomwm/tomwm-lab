/**
 * Reads cards.ts and writes quiz-export.md — hand to ChatGPT to write better MCQs.
 * Run: node scripts/export-quiz.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, '../src/data/cards.ts'), 'utf8');

// Strip TS-specific syntax so we can JSON.parse it
const json = raw
  .replace(/^export const migrationCards = /, '')
  .replace(/ as const;\s*export type.*$/s, '')
  .trim();

const cards = JSON.parse(json);

// Deduplicate (same logic as utils.ts)
const seen = new Set();
const unique = [...cards].reverse().filter(c => {
  if (seen.has(c.id)) return false;
  seen.add(c.id);
  return true;
}).reverse();

const ERA_MAP = {
  'Early medieval': 'Early Medieval',
  'Medieval': 'Medieval',
  'Early modern': 'Early Modern',
  'Empire and industrial Britain': 'Empire & Industrial',
  'World wars and interwar': 'World Wars & Interwar',
  'Post-war and decolonisation': 'Post-War & Decolonisation',
  'Late twentieth / contemporary': 'Modern Britain & Migration',
  'Uncertain': 'Other',
};

const PERSON_IDS = new Set([
  'alfred-the-great', 'emma-of-normandy', 'cnut-the-great', 'henry-ii',
  'king-john', 'sir-john-hawkins', 'walter-raleigh', 'robert-clive',
  'warren-hastings', 'cecil-john-rhodes', 'mahatma-gandhi', 'jomo-kenyatta',
  'enoch-powell', 'claudia-jones', 'kwame-nkrumah', 'idi-amin',
  'bernard-grant', 'margaret-thatcher',
]);

const THEME_IDS = new Set(['hundred-years-war']);

function getKind(card) {
  if (PERSON_IDS.has(card.id)) return 'person';
  if (THEME_IDS.has(card.id)) return 'theme';
  if (card.cardType.startsWith('Macro theme')) return 'theme';
  return 'event';
}

const ERA_ORDER = [
  'Early Medieval', 'Medieval', 'Early Modern', 'Empire & Industrial',
  'World Wars & Interwar', 'Post-War & Decolonisation', 'Modern Britain & Migration',
];

// Group by era
const byEra = {};
for (const era of ERA_ORDER) byEra[era] = [];
for (const card of unique) {
  const era = ERA_MAP[card.periodBucket] ?? card.periodBucket;
  if (byEra[era]) byEra[era].push(card);
}

let md = `# Task for ChatGPT — AQA Migration Timeline Quiz Questions

## What you are doing
You are improving the multiple-choice answer options for a quiz on AQA GCSE History Paper 2 (Migration, Empires & the People).

The quiz app already works. I do not want you to change any code or structure. The only thing I want you to produce is a single TypeScript file that exports an array of improved quiz questions.

---

## The output file

Create **one TypeScript file** with this exact shape:

\`\`\`ts
// src/data/quiz-questions.ts
export interface Question {
  cardId: string;    // matches the card's id field — do not change
  question: string;  // the question text — you may improve wording
  correct: string;   // the correct answer — do not change the meaning
  options: string[]; // exactly 4 items; correct must be one of them
  explanation: string; // one sentence shown after the user answers
}

export const quizQuestions: Question[] = [
  // ... all questions here
];
\`\`\`

Rules:
- **options** must contain exactly 4 strings. One must equal **correct** exactly.
- The 3 wrong options must be plausible but clearly incorrect to someone who has revised — not silly or obviously wrong.
- Wrong options should be drawn from real historical facts from other cards in the same era where possible, so they feel like genuine distractors.
- **explanation** should be one sentence that reinforces why the correct answer is right (not just repeats it).
- Do not add new question types. Keep the same question stems (date / key fact / consequences / causes).
- Do not import or reference anything outside this file — it is self-contained data only.

---

## Worked example

Input (what the app currently generates):

\`\`\`
Card: Battle of Edington
Correct answer (date): 878
Current wrong options: randomly picked dates from other cards
\`\`\`

Expected output:

\`\`\`ts
{
  cardId: "battle-of-edington",
  question: "When did the Battle of Edington take place?",
  correct: "878",
  options: ["865", "878", "793", "1016"],
  explanation: "878 was the year Alfred decisively defeated the Vikings at Edington, forcing Guthrum to accept the Treaty of Wedmore."
}
\`\`\`

The wrong options (865 — the Great Heathen Army's arrival, 793 — Lindisfarne, 1016 — Cnut's conquest) are all real Viking-era dates that a student might confuse.

---

## Cards to convert

Below are all 90 cards. For each card I give you the content, key facts, causes and consequences. Generate **one question per card** (your choice of type — pick whichever makes the most interesting question for that card). Output every question in the array.

---

`;


for (const era of ERA_ORDER) {
  const cards = byEra[era];
  if (!cards.length) continue;
  md += `## ${era}\n\n`;

  for (const card of cards) {
    const kind = getKind(card);
    md += `### ${card.title}  \n`;
    md += `**ID:** \`${card.id}\` · **Kind:** ${kind} · **Date:** ${card.dateRange} · **Era:** ${era}\n\n`;
    md += `**Summary:** ${card.cardContent}\n\n`;

    if (card.extractedKeyFacts.length) {
      md += `**Key facts:**\n`;
      for (const f of card.extractedKeyFacts) md += `- ${f}\n`;
      md += '\n';
    }

    md += `**Causes:** ${card.timeline.causes}\n\n`;
    md += `**Consequences:** ${card.timeline.consequences}\n\n`;

    md += `**Current quiz questions generated from this card:**\n\n`;
    md += `> Q (date): When did "${card.title}" take place?\n`;
    md += `> Correct answer: ${card.dateRange}\n\n`;

    if (card.extractedKeyFacts.length) {
      md += `> Q (key fact): Which of the following is true about "${card.title}"?\n`;
      md += `> Correct answer: ${card.extractedKeyFacts[0]}\n\n`;
    }

    md += `> Q (consequences): What were the main consequences of "${card.title}"?\n`;
    md += `> Correct answer: ${card.timeline.consequences}\n\n`;

    md += `> Q (causes): What were the main causes of "${card.title}"?\n`;
    md += `> Correct answer: ${card.timeline.causes}\n\n`;

    md += `---\n\n`;
  }
}

const outPath = join(__dirname, '../quiz-export.md');
writeFileSync(outPath, md);
console.log(`Written ${unique.length} cards to quiz-export.md`);
