import type { CardType, PromptType } from "@/db/schema";

/**
 * Two genuinely different activities share the word "practice".
 *
 * `recall` — the card holds a checkable answer (the exact quotation). Write it,
 * reveal it, compare. Self-rating is honest because you either had the words or
 * you didn't.
 *
 * `produce` — there is no right answer. She's constructing an argument. Nothing
 * can be "revealed" that answers the question she was asked, so instead the
 * comparison point is her own previous attempt, and the rating asks whether she
 * got further rather than whether she was correct.
 *
 * The distinction is a property of the prompt, not the card: an evidence card
 * carries one recall prompt and two produce prompts.
 */
export type PracticeMode = "recall" | "produce";

export interface GeneratedPrompt {
  promptType: PromptType;
  question: string;
  mode: PracticeMode;
}

export interface PracticeCardShape {
  type: CardType;
  title: string;
  locationRef: string | null;
  speakerOrNarrator: string | null;
  /** Whether an exact quotation has actually been recorded on the card. */
  hasQuote?: boolean;
}

/** Quotes a card title, avoiding doubled marks when the title is itself a quotation. */
function q(title: string): string {
  const trimmed = title.trim();
  const alreadyQuoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("“") && trimmed.endsWith("”"));
  return alreadyQuoted ? trimmed : `"${trimmed}"`;
}

// Deterministic prompt templates per card type. Kept template-based (not
// AI-generated) so practice works reliably with no API key configured, and
// so the same card always produces a recognisable, fair prompt.
export function generatePromptsForCard(card: PracticeCardShape): GeneratedPrompt[] {
  const where = card.locationRef ? ` (${card.locationRef})` : "";

  switch (card.type) {
    case "evidence":
      // An evidence card with no quotation recorded yet is an unfinished card,
      // not practice material — "recall the exact quotation" against a blank
      // can neither be answered nor checked. It stays on the needs-checking
      // list until she adds the quote, at which point these prompts appear.
      if (!card.hasQuote) return [];
      return [
        {
          promptType: "evidence_retrieval",
          mode: "recall",
          question: `Recall the exact quotation for ${q(card.title)}${where}${card.speakerOrNarrator ? `, spoken by ${card.speakerOrNarrator}` : ""}. Write it out as precisely as you can before checking.`,
        },
        {
          promptType: "explain_effect",
          mode: "produce",
          question: `Looking again at ${q(card.title)}: how does the writer's choice of language, form or structure here create its effect? Be specific about a word, image or technique.`,
        },
        {
          promptType: "close_reading",
          mode: "produce",
          question: `Close-read ${q(card.title)}${where} as if you'd never seen it before. Work through language, then form, then structure — what does each contribute, and what's the cumulative effect on the reader?`,
        },
      ];
    case "method":
      return [
        {
          promptType: "explain_effect",
          mode: "produce",
          question: `Explain the writer's method in ${q(card.title)}: what does this technique do to the reader's experience that a more conventional choice wouldn't?`,
        },
        {
          // Retrieval in the ordinary sense, but nothing on the card can confirm
          // which two moments she picked — so it's produce, not recall.
          promptType: "evidence_retrieval",
          mode: "produce",
          question: `Give two specific moments where ${q(card.title)} is at work, and say what each one achieves.`,
        },
      ];
    case "theme":
      return [
        {
          promptType: "recall",
          mode: "produce",
          question: `Trace how the theme of ${q(card.title)} develops across the text. Where does it become complicated, contradicted, or turned on its head?`,
        },
        {
          promptType: "thesis",
          mode: "produce",
          question: `Write a thesis (2–3 sentences) responding to this proposition: ${q(card.title)} is the text's central concern. Agree, disagree, or complicate it — and make your position arguable rather than obvious.`,
        },
      ];
    case "character":
      return [
        {
          promptType: "recall",
          mode: "produce",
          question: `Trace ${q(card.title)} across the text: what changes, and where is their position most ambiguous or open to debate?`,
        },
      ];
    case "context":
      return [
        {
          promptType: "context_link",
          mode: "produce",
          question: `Explain why the contextual detail in ${q(card.title)} matters for this text specifically — not just what it is, but what it changes about how a moment should be read.`,
        },
      ];
    case "interpretation":
      return [
        {
          promptType: "recall",
          mode: "produce",
          question: `Recall two moments in the text that support the interpretation ${q(card.title)}.`,
        },
        {
          promptType: "alternative_reading",
          mode: "produce",
          question: `What is the strongest piece of evidence that complicates or resists ${q(card.title)}? Give the counter-evidence, not just a restatement.`,
        },
        {
          promptType: "paragraph",
          mode: "produce",
          question: `Write one paragraph arguing ${q(card.title)}. Move through: claim → evidence → analysis → complication or alternative reading → return to the argument. Don't stop at the evidence.`,
        },
      ];
    case "comparison":
      return [
        {
          promptType: "comparison",
          mode: "produce",
          question: `For the comparison ${q(card.title)}: state the similarity or difference precisely, then support it with one piece of evidence from each text.`,
        },
      ];
    case "performance":
      return [
        {
          promptType: "alternative_reading",
          mode: "produce",
          question: `What does the reading or production choice in ${q(card.title)} imply about the text? How far do you agree, and why?`,
        },
      ];
    default:
      return [];
  }
}

// ─── Cloze drilling for quotations ─────────────────────────────────────────
// Blanking words out and recalling them is a far stronger memorisation drill
// than reading a quote back. Deterministic (same card always gaps the same
// words) so repeated attempts are comparable.

export interface ClozeQuote {
  /** Tokens in order; `blank: true` means the word is hidden. */
  tokens: { text: string; blank: boolean }[];
  blankCount: number;
}

export function clozeQuote(quote: string, difficulty: "light" | "hard" = "light"): ClozeQuote {
  const words = quote.split(/\s+/).filter(Boolean);
  // A one-word quotation has no frame to recall into — blanking its only word
  // leaves nothing — so no hint is offered and it's recalled cold.
  if (words.length < 2) {
    return { tokens: words.map((text) => ({ text, blank: false })), blankCount: 0 };
  }

  const bare = (w: string) => w.replace(/[^\p{L}\p{N}']/gu, "");
  // Gap roughly every third word (every other word when hard), skipping very
  // short function words so the gaps land on words worth recalling.
  const step = difficulty === "hard" ? 2 : 3;
  let seen = 0;
  const tokens = words.map((w) => {
    const worthBlanking = bare(w).length > 3;
    if (!worthBlanking) return { text: w, blank: false };
    seen += 1;
    return { text: w, blank: seen % step === 0 };
  });

  // Short lines often have too few long words for the step to land on any
  // ("Blow, winds", "I am not a mother"), and a hint with no gaps is just the
  // answer. Always gap at least one: the longest word, first on ties.
  if (!tokens.some((t) => t.blank)) {
    let longest = 0;
    words.forEach((w, i) => {
      if (bare(w).length > bare(words[longest]).length) longest = i;
    });
    tokens[longest].blank = true;
  }

  return { tokens, blankCount: tokens.filter((t) => t.blank).length };
}
