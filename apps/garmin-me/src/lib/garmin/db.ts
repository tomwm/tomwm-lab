/**
 * Local cache: one SQLite file outside the repo holding Garmin's raw JSON
 * responses, untouched. Everything the UI shows is derived from these rows by
 * normalize.ts at read time, so adding a metric never needs a migration or a
 * re-download.
 */
import { chmodSync, mkdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { DATA_DIR, DB_FILE } from './config'

export type RawKind = 'activity' | 'summary' | 'sleep' | 'hrv' | 'weight' | 'zones'

const g = globalThis as unknown as { __garminDb?: DatabaseSync }

export function db(): DatabaseSync {
  if (!g.__garminDb) {
    mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 })
    const d = new DatabaseSync(DB_FILE)
    d.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS raw (
        kind TEXT NOT NULL,
        key TEXT NOT NULL,          -- activity id, or calendar date
        json TEXT NOT NULL,         -- Garmin's response, or 'null' for "no record"
        fetched_at INTEGER NOT NULL,
        PRIMARY KEY (kind, key)
      );
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      -- The coach's last answer of each kind (workout, insights), so a revisit doesn't re-run the model.
      CREATE TABLE IF NOT EXISTS ai_results (kind TEXT PRIMARY KEY, json TEXT NOT NULL, created_at INTEGER NOT NULL);
    `)
    try {
      chmodSync(DB_FILE, 0o600) // personal health data: owner-only
    } catch {}
    g.__garminDb = d
  }
  return g.__garminDb
}

export function putRaw(kind: RawKind, key: string, value: unknown) {
  db()
    .prepare('INSERT OR REPLACE INTO raw (kind, key, json, fetched_at) VALUES (?, ?, ?, ?)')
    .run(kind, key, JSON.stringify(value ?? null), Date.now())
}

export function allRaw(kind: RawKind): { key: string; json: string }[] {
  return db().prepare('SELECT key, json FROM raw WHERE kind = ?').all(kind) as { key: string; json: string }[]
}

export function fetchedAt(kind: RawKind): Map<string, number> {
  const rows = db().prepare('SELECT key, fetched_at FROM raw WHERE kind = ?').all(kind) as {
    key: string
    fetched_at: number
  }[]
  return new Map(rows.map((r) => [r.key, r.fetched_at]))
}

export function getMeta(key: string): string | null {
  const row = db().prepare('SELECT value FROM meta WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setMeta(key: string, value: string) {
  db().prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run(key, value)
}

export function getAiResult<T>(kind: string): T | null {
  const row = db().prepare('SELECT json FROM ai_results WHERE kind = ?').get(kind) as { json: string } | undefined
  return row ? (JSON.parse(row.json) as T) : null
}

export function putAiResult(kind: string, value: unknown) {
  db().prepare('INSERT OR REPLACE INTO ai_results (kind, json, created_at) VALUES (?, ?, ?)').run(kind, JSON.stringify(value), Date.now())
}
