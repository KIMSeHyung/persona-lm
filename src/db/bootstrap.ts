import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { dbPath, sqlite, type PersonaDatabaseClient } from "./client";

const supportMigrationTable = "__persona_support_migrations";

interface ApplyDatabaseSupportMigrationsInput {
  client?: PersonaDatabaseClient;
  migrationsDir?: string;
}

interface ApplyDatabaseSupportMigrationsResult {
  appliedCount: number;
  appliedMigrations: string[];
}

/**
 * Applies SQLite-specific support migrations such as FTS tables and triggers after schema push.
 */
export function applyDatabaseSupportMigrations(
  input: ApplyDatabaseSupportMigrationsInput = {}
): ApplyDatabaseSupportMigrationsResult {
  const sqliteDatabase = input.client?.sqlite ?? sqlite;
  const migrationsDir = input.migrationsDir ?? resolveSupportMigrationsDir();

  sqliteDatabase.exec(`
    CREATE TABLE IF NOT EXISTS ${supportMigrationTable} (
      name TEXT PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);

  const migrationFiles = readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();
  const appliedRows = sqliteDatabase
    .prepare(`SELECT name FROM ${supportMigrationTable}`)
    .all() as Array<{ name: string }>;
  const appliedNames = new Set(appliedRows.map((row) => row.name));
  const recordAppliedMigration = sqliteDatabase.prepare(`
    INSERT INTO ${supportMigrationTable} (name, applied_at)
    VALUES (?, ?)
  `);
  const applyMigration = sqliteDatabase.transaction((fileName: string, sqlText: string) => {
    sqliteDatabase.exec(sqlText);
    recordAppliedMigration.run(fileName, Date.now());
  });
  const newlyApplied: string[] = [];

  for (const fileName of migrationFiles) {
    if (appliedNames.has(fileName)) {
      continue;
    }

    const sqlText = readFileSync(path.join(migrationsDir, fileName), "utf8");
    applyMigration(fileName, sqlText);
    newlyApplied.push(fileName);
  }

  return {
    appliedCount: newlyApplied.length,
    appliedMigrations: newlyApplied
  };
}

/**
 * Resolves the repository-local directory that stores SQLite support migration SQL files.
 */
function resolveSupportMigrationsDir(): string {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../drizzle/support"
  );
}

/**
 * Runs support migrations as a small CLI entry point for local development.
 */
function runCli(): void {
  const result = applyDatabaseSupportMigrations();

  console.log("database support migrations complete");
  console.log(`- SQLite database path: ${dbPath}`);
  console.log(`- Applied support migrations: ${result.appliedCount}`);

  if (result.appliedMigrations.length > 0) {
    console.log(`- Files: ${result.appliedMigrations.join(", ")}`);
  }
}

if (isMainModule()) {
  runCli();
}

/**
 * Detects direct execution so the module can be imported without triggering the CLI.
 */
function isMainModule(): boolean {
  const entryPath = process.argv[1];

  if (entryPath === undefined) {
    return false;
  }

  return fileURLToPath(import.meta.url) === path.resolve(entryPath);
}
