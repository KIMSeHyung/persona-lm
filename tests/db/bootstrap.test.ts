import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  applyDatabaseSupportMigrations
} from "../../src/db/bootstrap";
import { createDatabaseClient, type PersonaDatabaseClient } from "../../src/db/client";

describe("applyDatabaseSupportMigrations", () => {
  let tempDir: string;
  let client: PersonaDatabaseClient;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "persona-lm-db-bootstrap-"));
    client = createDatabaseClient(tempDir);

    client.sqlite.exec(`
      CREATE TABLE personas (
        id TEXT PRIMARY KEY NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE memories (
        id TEXT PRIMARY KEY NOT NULL,
        persona_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        summary TEXT NOT NULL,
        canonical_text TEXT NOT NULL,
        status TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        stability TEXT NOT NULL,
        scope_json TEXT,
        tags_json TEXT,
        source_types_json TEXT,
        evidence_ids_json TEXT,
        metadata_json TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        valid_from INTEGER,
        valid_to INTEGER
      );
    `);
  });

  afterEach(() => {
    client.sqlite.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("applies support migration SQL once and backfills the FTS table", () => {
    client.sqlite
      .prepare(
        `
          INSERT INTO memories (
            id,
            persona_id,
            kind,
            summary,
            canonical_text,
            status,
            confidence,
            stability,
            scope_json,
            tags_json,
            source_types_json,
            evidence_ids_json,
            metadata_json,
            created_at,
            updated_at,
            valid_from,
            valid_to
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        "mem_1",
        "persona_demo",
        "decision_rule",
        "콘텐츠 버전 관리",
        "콘텐츠 버전 관리와 이력 보존",
        "confirmed",
        950,
        "stable",
        "[\"cms_versioning\"]",
        "[\"cms_versioning\"]",
        "[\"seed\"]",
        "[]",
        "{}",
        Date.now(),
        Date.now(),
        null,
        null
      );

    const firstRun = applyDatabaseSupportMigrations({ client });
    const secondRun = applyDatabaseSupportMigrations({ client });
    const ftsRows = client.sqlite
      .prepare("SELECT memory_id AS memoryId FROM memories_fts WHERE memories_fts MATCH ?")
      .all("콘텐츠 OR 버전") as Array<{ memoryId: string }>;
    const migrationRows = client.sqlite
      .prepare("SELECT COUNT(*) AS count FROM __persona_support_migrations")
      .get() as { count: number };

    expect(firstRun.appliedMigrations).toContain("0001_memories_fts.sql");
    expect(secondRun.appliedCount).toBe(0);
    expect(ftsRows.map((row) => row.memoryId)).toContain("mem_1");
    expect(migrationRows.count).toBe(1);
  });
});
