import { createClient, type Client } from "@libsql/client";

let _db: Client | null = null;

function getDb(): Client {
  if (!_db) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }
  return _db;
}

export async function initDb() {
  const db = getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS dream_submissions (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      date    TEXT NOT NULL,
      themes  TEXT NOT NULL,
      symbols TEXT NOT NULL DEFAULT '[]'
    );
    CREATE INDEX IF NOT EXISTS idx_date ON dream_submissions(date);
  `);
}

export async function insertDreamSubmission(date: string, themes: string[], symbols: string[]): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO dream_submissions (date, themes, symbols) VALUES (?, ?, ?)`,
    args: [date, JSON.stringify(themes), JSON.stringify(symbols)],
  });
}

function countMatches(rows: { themes?: string; symbols?: string }[], field: "themes" | "symbols", ownItems: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of ownItems) counts[item] = 0;

  for (const row of rows) {
    const rowItems: string[] = JSON.parse((row[field] as string) ?? "[]");
    for (const item of ownItems) {
      if (rowItems.includes(item)) counts[item]++;
    }
  }

  for (const item of ownItems) {
    counts[item] = Math.max(0, counts[item] - 1);
  }

  return counts;
}

export async function getCountsForToday(
  date: string,
  themes: string[],
  symbols: string[]
): Promise<{ themeCounts: Record<string, number>; symbolCounts: Record<string, number> }> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT themes, symbols FROM dream_submissions WHERE date = ?`,
    args: [date],
  });

  const rows = result.rows as unknown as { themes: string; symbols: string }[];

  return {
    themeCounts: countMatches(rows, "themes", themes),
    symbolCounts: countMatches(rows, "symbols", symbols),
  };
}

export async function getDreamerCountForToday(date: string): Promise<number> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT COUNT(*) as count FROM dream_submissions WHERE date = ?`,
    args: [date],
  });
  return Number(result.rows[0][0]);
}

export async function getTotalDreamerCount(): Promise<number> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT COUNT(*) as count FROM dream_submissions`,
    args: [],
  });
  return Number(result.rows[0][0]);
}
