import { createClient } from "@libsql/client";

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export async function initDB() {
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      members TEXT NOT NULL,
      member_shares TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  // migrate existing tables
  await db.execute(`ALTER TABLE trips ADD COLUMN member_shares TEXT NOT NULL DEFAULT '{}'`).catch(() => {});
  await db.execute(`ALTER TABLE trips ADD COLUMN couples TEXT NOT NULL DEFAULT '[]'`).catch(() => {});
  await db.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_by TEXT NOT NULL,
      splits TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

function uuid() {
  return crypto.randomUUID();
}

function parseMembers(raw: string): string[] {
  return JSON.parse(raw);
}

function parseSplits(raw: string): Record<string, number> {
  return JSON.parse(raw);
}

export async function createTrip(name: string, members: string[]) {
  const db = getClient();
  const id = uuid();
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  await db.execute({
    sql: `INSERT INTO trips (id, code, name, members) VALUES (?, ?, ?, ?)`,
    args: [id, code, name, JSON.stringify(members)],
  });
  return { id, code, name, members };
}

export async function getTrip(code: string) {
  const db = getClient();
  const res = await db.execute({
    sql: `SELECT * FROM trips WHERE code = ?`,
    args: [code.toUpperCase()],
  });
  if (!res.rows.length) return null;
  const row = res.rows[0];
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    members: parseMembers(row.members as string),
    member_shares: parseSplits((row.member_shares as string) || "{}"),
    couples: JSON.parse((row.couples as string) || "[]") as [string, string][],
  };
}

export async function getExpenses(tripId: string) {
  const db = getClient();
  const res = await db.execute({
    sql: `SELECT * FROM expenses WHERE trip_id = ? ORDER BY created_at ASC`,
    args: [tripId],
  });
  return res.rows.map((row) => ({
    id: row.id as string,
    trip_id: row.trip_id as string,
    description: row.description as string,
    amount: row.amount as number,
    paid_by: row.paid_by as string,
    splits: parseSplits(row.splits as string),
  }));
}

export async function addExpense(
  tripId: string,
  description: string,
  amount: number,
  paidBy: string,
  splits: Record<string, number>
) {
  const db = getClient();
  const id = uuid();
  await db.execute({
    sql: `INSERT INTO expenses (id, trip_id, description, amount, paid_by, splits) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, tripId, description, amount, paidBy, JSON.stringify(splits)],
  });
  return { id, trip_id: tripId, description, amount, paid_by: paidBy, splits };
}

export async function deleteExpense(id: string) {
  const db = getClient();
  await db.execute({ sql: `DELETE FROM expenses WHERE id = ?`, args: [id] });
}

export async function updateExpenseSplits(id: string, splits: Record<string, number>) {
  const db = getClient();
  await db.execute({
    sql: `UPDATE expenses SET splits = ? WHERE id = ?`,
    args: [JSON.stringify(splits), id],
  });
  return { id, splits };
}

export async function updateCouples(tripId: string, couples: [string, string][]) {
  const db = getClient();
  await db.execute({
    sql: `UPDATE trips SET couples = ? WHERE id = ?`,
    args: [JSON.stringify(couples), tripId],
  });
  return couples;
}

export async function updateMemberShares(tripId: string, memberShares: Record<string, number>) {
  const db = getClient();
  await db.execute({
    sql: `UPDATE trips SET member_shares = ? WHERE id = ?`,
    args: [JSON.stringify(memberShares), tripId],
  });
  return memberShares;
}
