/**
 * The app's word-count rule: whitespace-separated tokens, with hyphenated
 * forms counted as one word. This is our rule for practice. It is not a claim
 * of exact parity with the real test's counter.
 */
export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/u).filter((t) => /[\p{L}\p{N}]/u.test(t)).length
}

export const WORD_LIMIT = 750

export interface Truncation {
  kept: string
  discarded: string
  keptWords: number
  truncated: boolean
}

/** Keep the first `limit` counted words, preserving the original spacing. */
export function truncateToWords(text: string, limit = WORD_LIMIT): Truncation {
  if (countWords(text) <= limit) {
    return { kept: text, discarded: '', keptWords: countWords(text), truncated: false }
  }
  let counted = 0
  const re = /\S+/gu
  let match: RegExpExecArray | null
  let cutIndex = text.length
  while ((match = re.exec(text)) !== null) {
    if (/[\p{L}\p{N}]/u.test(match[0])) {
      counted++
      if (counted === limit) {
        cutIndex = match.index + match[0].length
        break
      }
    }
  }
  return {
    kept: text.slice(0, cutIndex),
    discarded: text.slice(cutIndex),
    keptWords: counted,
    truncated: true,
  }
}
