import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

// Turso when TURSO_DATABASE_URL is set (on Vercel, whose filesystem is
// read-only and ephemeral); the local SQLite file otherwise. One driver for
// both, so local behaviour matches production.
function connectionConfig() {
  if (process.env.TURSO_DATABASE_URL) {
    return { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN };
  }
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return { url: `file:${path.join(dataDir, "revisionlab.db")}` };
}

const globalForDb = globalThis as unknown as {
  _db?: ReturnType<typeof createDb>;
  _dbSchema?: unknown;
};

function createDb() {
  const client = createClient(connectionConfig());
  // Cascading deletes (a card's links, practice history, section bindings)
  // depend on SQLite foreign keys, which are off per connection by default.
  client.execute("PRAGMA foreign_keys = ON").catch(() => {});
  return drizzle(client, { schema });
}

if (process.env.NODE_ENV !== "production" && globalForDb._dbSchema !== schema) {
  globalForDb._db = undefined;
}

export const db = globalForDb._db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb._db = db;
  globalForDb._dbSchema = schema;
}

export type DB = typeof db;
