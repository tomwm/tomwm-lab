import { describe, expect, it } from 'vitest'
import { WORD_LIMIT, countWords, truncateToWords } from './wordcount'

describe('word counting', () => {
  it('counts whitespace-separated tokens', () => {
    expect(countWords('one two three')).toBe(3)
  })

  it('counts a hyphenated form as one word', () => {
    expect(countWords('a well-argued point')).toBe(3)
  })

  it('collapses runs of whitespace and newlines', () => {
    expect(countWords('  one \n\n  two\t\tthree  ')).toBe(3)
  })

  it('is zero for empty and whitespace-only text', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n\t ')).toBe(0)
  })

  it('ignores stray punctuation tokens', () => {
    expect(countWords('word — word')).toBe(2)
  })
})

describe('truncation at the limit', () => {
  const text = Array.from({ length: WORD_LIMIT + 50 }, (_, i) => `w${i}`).join(' ')

  it('leaves text within the limit untouched', () => {
    const short = 'a b c'
    const result = truncateToWords(short)
    expect(result.truncated).toBe(false)
    expect(result.kept).toBe(short)
  })

  it('keeps exactly the first 750 counted words', () => {
    const result = truncateToWords(text)
    expect(result.truncated).toBe(true)
    expect(result.keptWords).toBe(WORD_LIMIT)
    expect(countWords(result.kept)).toBe(WORD_LIMIT)
  })

  it('preserves the discarded remainder so nothing is lost', () => {
    const result = truncateToWords(text)
    expect(countWords(result.kept + result.discarded)).toBe(WORD_LIMIT + 50)
  })

  it('handles a draft of exactly the limit', () => {
    const exact = Array.from({ length: WORD_LIMIT }, (_, i) => `w${i}`).join(' ')
    const result = truncateToWords(exact)
    expect(result.truncated).toBe(false)
    expect(countWords(result.kept)).toBe(WORD_LIMIT)
  })

  it('handles one word over the limit', () => {
    const over = Array.from({ length: WORD_LIMIT + 1 }, (_, i) => `w${i}`).join(' ')
    const result = truncateToWords(over)
    expect(result.truncated).toBe(true)
    expect(result.keptWords).toBe(WORD_LIMIT)
    expect(result.discarded.trim()).toBe(`w${WORD_LIMIT}`)
  })
})
