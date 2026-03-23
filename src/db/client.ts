import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const dataDir = path.resolve(process.cwd(), "data");
const dbPath = path.join(dataDir, "persona.db");

mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(dbPath);

export const db = drizzle(sqlite);
export { dbPath, sqlite };
