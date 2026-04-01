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

// Returns the top N themes or symbols over the last `days` days, ranked by total count.
// Result: [{ label: string, count: number }]
export async function getTopItems(
  field: "themes" | "symbols",
  days: number,
  limit: number
): Promise<{ label: string; count: number }[]> {
  const db = getDb();
  const since = daysAgo(days);
  const result = await db.execute({
    sql: `SELECT ${field} FROM dream_submissions WHERE date >= ?`,
    args: [since],
  });

  const tally: Record<string, number> = {};
  for (const row of result.rows) {
    const items: string[] = JSON.parse((row[0] as string) ?? "[]");
    for (const item of items) {
      tally[item] = (tally[item] ?? 0) + 1;
    }
  }

  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

// Returns daily counts for a specific item over the last `days` days.
// Result: [{ date: string, count: number }] — one entry per day, 0 if none.
export async function getItemHistory(
  field: "themes" | "symbols",
  item: string,
  days: number
): Promise<{ date: string; count: number }[]> {
  const db = getDb();
  const since = daysAgo(days);
  const result = await db.execute({
    sql: `SELECT date, ${field} FROM dream_submissions WHERE date >= ? ORDER BY date ASC`,
    args: [since],
  });

  // Build a map of date -> count
  const byDate: Record<string, number> = {};
  for (const row of result.rows) {
    const date = row[0] as string;
    const items: string[] = JSON.parse((row[1] as string) ?? "[]");
    if (items.includes(item)) {
      byDate[date] = (byDate[date] ?? 0) + 1;
    }
  }

  // Fill in all days including zeroes
  return Array.from({ length: days }, (_, i) => {
    const date = daysAgo(days - 1 - i);
    return { date, count: byDate[date] ?? 0 };
  });
}

// Returns YYYY-MM-DD string for N days ago
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
