/**
 * Securely store the Garmin Personal API key.
 *
 *   npm run garmin:key
 *
 * Prompts with hidden input (nothing is echoed, nothing lands in shell
 * history), writes the key to ~/.config/garmin-me/api-key with mode 600,
 * then checks it against Garmin's token endpoint. The key is never printed.
 */
import { chmod, mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { API_KEY_FILE } from '../src/lib/garmin/config'
import { GarminError, garminGet } from '../src/lib/garmin/client'

function readHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin
    if (!stdin.isTTY) {
      reject(new Error('Run this in an interactive terminal so the key can be entered privately.'))
      return
    }
    process.stdout.write(prompt)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    let value = ''
    const done = (err?: Error) => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.off('data', onData)
      process.stdout.write('\n')
      if (err) reject(err)
      else resolve(value)
    }
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') return done()
        if (ch === '\u0003') return done(new Error('Cancelled.')) // Ctrl-C
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1)
        else if (ch >= ' ') value += ch
      }
    }
    stdin.on('data', onData)
  })
}

async function main() {
  console.log('Garmin Connect Personal API key')
  console.log('Create one at https://connect.garmin.com/app/settings/personalApiToken\n')
  const key = (await readHidden('Paste the key and press Return (input is hidden): ')).trim()
  if (!key) throw new Error('No key entered; nothing was saved.')

  await mkdir(dirname(API_KEY_FILE), { recursive: true, mode: 0o700 })
  await writeFile(API_KEY_FILE, key + '\n', { mode: 0o600 })
  await chmod(API_KEY_FILE, 0o600)
  console.log(`Saved to ${API_KEY_FILE} (readable only by you).`)

  // The env var would override the file we just wrote; test the file's key.
  delete process.env.GARMIN_PERSONAL_API_KEY
  process.stdout.write('Checking it with Garmin… ')
  try {
    await garminGet('/biometric-service/heartRateZones/v2')
    console.log('connected. ✔')
  } catch (e) {
    if (e instanceof GarminError && e.kind === 'auth') {
      console.log('rejected. ✘')
      console.error(e.message)
      process.exitCode = 1
    } else {
      // Signed in fine but the test endpoint misbehaved: the key itself is OK.
      console.log(`signed in, but the test request failed: ${(e as Error).message}`)
    }
  }
}

main().catch((e) => {
  console.error((e as Error).message)
  process.exit(1)
})
