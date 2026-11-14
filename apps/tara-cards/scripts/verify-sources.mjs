/**
 * Confirms every URL in the source manifest still resolves, so the app never
 * shows the learner a dead "open source" link. Prints a report and exits
 * non-zero if anything is broken.
 *
 *   node scripts/verify-sources.mjs
 */
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/content/sources.ts', import.meta.url), 'utf8')
const gen = readFileSync(new URL('../src/content/sources.generated.ts', import.meta.url), 'utf8')
const urls = [...new Set([...`${src}\n${gen}`.matchAll(/https?:\/\/[^\s'"`)]+/g)].map((m) => m[0]))]

let failures = 0
const limit = 8
const queue = urls.slice()

async function worker() {
  while (queue.length) {
    const url = queue.shift()
    try {
      let res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
      if (res.status === 405 || res.status === 403) {
        res = await fetch(url, { method: 'GET', redirect: 'follow' })
      }
      if (!res.ok) {
        failures++
        console.log(`FAIL ${res.status}  ${url}`)
      } else {
        console.log(`ok   ${res.status}  ${url}`)
      }
    } catch (err) {
      failures++
      console.log(`FAIL ERR     ${url}  (${err.message})`)
    }
  }
}

await Promise.all(Array.from({ length: limit }, worker))
console.log(`\n${urls.length} URLs checked, ${failures} failed.`)
process.exit(failures ? 1 : 0)
