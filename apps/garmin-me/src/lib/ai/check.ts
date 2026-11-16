/**
 * A light guard against invented figures: every number the model quotes as
 * evidence should appear in the brief it was given. Anything that doesn't is
 * flagged in the UI rather than silently trusted.
 */
const NUM = /\d+(?:[.:]\d+)?/g

export function numbersIn(text: string): number[] {
  return (text.match(NUM) ?? []).map((t) => (t.includes(':') ? NaN : Number(t))).filter((n) => Number.isFinite(n))
}

/** Numbers in `claim` that don't match any number in `source` (allowing for rounding). */
export function unsupportedNumbers(claim: string, source: string): string[] {
  const known = numbersIn(source)
  const paces = new Set((source.match(/\d+:\d{2}/g) ?? []))
  const bad: string[] = []
  for (const tok of claim.match(NUM) ?? []) {
    if (tok.includes(':')) {
      if (!paces.has(tok)) bad.push(tok)
      continue
    }
    const n = Number(tok)
    // Same figure, or the same figure rounded (82.81 -> 82.8, 56.6 -> 57). Nothing looser, so a
    // plausible-looking but different number is still caught.
    const ok = known.some((k) => Math.abs(k - n) < 0.051 || (Number.isInteger(n) && Math.round(k) === n))
    if (!ok) bad.push(tok)
  }
  return [...new Set(bad)]
}
