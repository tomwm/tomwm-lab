import { defineConfig } from "drizzle-kit";

// Targets Turso when TURSO_DATABASE_URL is set, otherwise the local file.
const tursoUrl = process.env.TURSO_DATABASE_URL;

export default defineConfig(
  tursoUrl
    ? {
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dialect: "turso",
        dbCredentials: { url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN },
      }
    : {
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dialect: "sqlite",
        dbCredentials: { url: "file:./data/revisionlab.db" },
      }
);
