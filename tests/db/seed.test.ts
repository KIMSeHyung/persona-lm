import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabaseClient, type PersonaDatabaseClient } from "../../src/db/client";
import { importDecisionSeedMemories } from "../../src/db/seed";

describe("importDecisionSeedMemories", () => {
  let tempDir: string;
  let client: PersonaDatabaseClient;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "persona-lm-db-seed-"));
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

  it("imports reviewed decision seed memories and deletes stale seed-backed rows", () => {
    const now = Date.now();

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
        "mem_stale_seed",
        "persona_demo",
        "decision_rule",
        "stale row",
        "stale row",
        "stale",
        100,
        "volatile",
        "[]",
        "[]",
        "[\"seed\"]",
        "[]",
        "{\"importSource\":\"reviewed_decision_seed\"}",
        now,
        now,
        now,
        null
      );

    const result = importDecisionSeedMemories({
      personaId: "persona_demo",
      slug: "persona-demo",
      displayName: "Persona Demo",
      client
    });

    const memoryCount = client.sqlite
      .prepare("SELECT COUNT(*) AS count FROM memories WHERE persona_id = ?")
      .get("persona_demo") as { count: number };
    const knownRow = client.sqlite
      .prepare(
        "SELECT confidence, metadata_json AS metadataJson FROM memories WHERE summary = ?"
      )
      .get("운영비와 유지 부담을 기술 선택의 초기에 계산한다") as {
      confidence: number;
      metadataJson: string;
    };
    const staleRowCount = client.sqlite
      .prepare("SELECT COUNT(*) AS count FROM memories WHERE id = ?")
      .get("mem_stale_seed") as { count: number };

    expect(result).toMatchObject({
      personaId: "persona_demo",
      importedCount: 25,
      deletedCount: 1,
      openQuestionCount: 6
    });
    expect(memoryCount.count).toBe(25);
    expect(knownRow.confidence).toBe(920);
    expect(knownRow.metadataJson).toContain('"importSource":"reviewed_decision_seed"');
    expect(staleRowCount.count).toBe(0);
  });

  it("is idempotent across repeated imports", () => {
    importDecisionSeedMemories({
      personaId: "persona_demo",
      client
    });
    const secondRun = importDecisionSeedMemories({
      personaId: "persona_demo",
      client
    });

    const memoryCount = client.sqlite
      .prepare("SELECT COUNT(*) AS count FROM memories WHERE persona_id = ?")
      .get("persona_demo") as { count: number };

    expect(secondRun.importedCount).toBe(25);
    expect(secondRun.deletedCount).toBe(0);
    expect(memoryCount.count).toBe(25);
  });
});
