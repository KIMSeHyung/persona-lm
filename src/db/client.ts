import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

export interface PersonaDatabaseClient {
  db: ReturnType<typeof drizzle>;
  sqlite: Database.Database;
  dbPath: string;
}

/**
 * Creates a SQLite-backed Drizzle client rooted at a given workspace directory.
 */
export function createDatabaseClient(rootDir: string = process.cwd()): PersonaDatabaseClient {
  const dataDir = path.resolve(rootDir, "data");
  const dbPath = path.join(dataDir, "persona.db");

  mkdirSync(dataDir, { recursive: true });

  const sqlite = new Database(dbPath);

  return {
    db: drizzle(sqlite),
    sqlite,
    dbPath
  };
}

const defaultDatabaseClient = createDatabaseClient();

export const db = defaultDatabaseClient.db;
export const sqlite = defaultDatabaseClient.sqlite;
export const dbPath = defaultDatabaseClient.dbPath;
