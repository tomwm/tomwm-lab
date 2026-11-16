/**
 * Personal files the app reads but never commits: your coach profile and
 * training plans. They live next to the Garmin cache, outside the repository:
 *   ~/Library/Application Support/garmin-me/private/
 * Edit them there; the app picks up changes on the next page load.
 */
import 'server-only'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DATA_DIR } from './garmin/config'

export const PRIVATE_DIR = join(DATA_DIR, 'private')

export const privatePath = (name: string) => join(PRIVATE_DIR, name)

/** Read a private file, or null if it doesn't exist. Malformed files throw with a clear message. */
export function readPrivate(name: string): string | null {
  const p = privatePath(name)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf8')
}

export function readPrivateJson<T>(name: string, fallback: T): T {
  const text = readPrivate(name)
  if (text === null) return fallback
  try {
    return JSON.parse(text) as T
  } catch (e) {
    throw new Error(`${privatePath(name)} isn't valid JSON: ${(e as Error).message}`)
  }
}
