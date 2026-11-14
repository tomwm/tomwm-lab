/**
 * Regenerates src/content/sources.ts from a TSV of paper links scraped from the
 * official archive. Run `node scripts/verify-sources.mjs` first to confirm the
 * links still resolve, and update `retrievedAt` when you do.
 *
 *   node scripts/generate-sources.mjs <papers.tsv>
 */
import { readFileSync, writeFileSync } from 'node:fs'

const tsv = process.argv[2]
if (!tsv) {
  console.error('usage: node scripts/generate-sources.mjs <papers.tsv>')
  process.exit(1)
}

const RETRIEVED = process.env.RETRIEVED_AT ?? new Date().toISOString().slice(0, 10)

const rows = readFileSync(tsv, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => {
    const [year, exam, kind, url] = l.split('\t')
    return { year, exam, kind, url }
  })

const byPaper = new Map()
for (const r of rows) {
  const key = `${r.exam}-${r.year}`
  const entry = byPaper.get(key) ?? { exam: r.exam, year: r.year }
  if (r.kind === 'Question-Paper') entry.paperUrl = r.url
  if (r.kind === 'Answer-Key') entry.keyUrl = r.url
  if (r.kind === 'Explained-Answers') entry.explainedUrl = r.url
  byPaper.set(key, entry)
}

const papers = [...byPaper.values()].sort((a, b) =>
  a.exam === b.exam ? a.year.localeCompare(b.year) : a.exam.localeCompare(b.exam),
)

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

const entries = papers.map((p) => {
  const id = `${p.exam.toLowerCase()}-${p.year}-s1`
  const note = p.explainedUrl
    ? 'Question paper, answer key and official explained answers are published. Not imported into interactive practice.'
    : 'Question paper and answer key are published. No official worked explanations. Not imported into interactive practice.'
  return `  {
    id: '${id}',
    exam: '${p.exam}',
    year: '${p.year}',
    section: 'Section 1',
    title: '${esc(`${p.year} ${p.exam} Section 1`)}',
    paperUrl: '${p.paperUrl}',
    keyUrl: ${p.keyUrl ? `'${p.keyUrl}'` : 'null'},${p.explainedUrl ? `\n    // Official explained answers: ${p.explainedUrl}` : ''}
    retrievedAt: '${RETRIEVED}',
    version: null,
    attribution: 'UAT-UK / Cambridge Assessment Admissions Testing, via the UAT-UK TARA preparation materials archive.',
    contentUse: 'link-only',
    importStatus: 'not-imported',
    note: '${esc(note)}',
  },`
})

const header = `import type { Source } from '@/domain/types'

/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: node scripts/generate-sources.mjs <papers.tsv>
 * Verify links with: node scripts/verify-sources.mjs
 *
 * Every paper below is linked, not imported. UAT-UK's preparation page states
 * that sharing test content during or after the admissions cycle is
 * prohibited, so every official source defaults to link-only and no question
 * text is reproduced in this repository. [S2]
 *
 * These are BMAT Section 1 and TSA Section 1 papers that UAT-UK offers as
 * useful preparation because those tests share a common history with TARA's
 * reasoning components. They are not past TARA papers. [S3]
 */

export const SOURCES_RETRIEVED_AT = '${RETRIEVED}'

export const ARCHIVE_SOURCES: Source[] = [
${entries.join('\n')}
]
`

writeFileSync(new URL('../src/content/sources.generated.ts', import.meta.url), header)
console.log(`Wrote ${papers.length} sources (retrievedAt ${RETRIEVED}).`)
