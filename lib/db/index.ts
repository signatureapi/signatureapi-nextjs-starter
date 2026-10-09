import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import * as schema from "./schema";

// Opening the file writes nothing, so `next build` workers can import this module in parallel.
const sqlite = new Database(process.env.DATABASE_URL ?? "sqlite.db");

export const db = drizzle(sqlite, { schema });

/** Applies the SQL migrations in drizzle/. Called once at server startup (instrumentation.ts). */
export function migrateDatabase() {
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
}
