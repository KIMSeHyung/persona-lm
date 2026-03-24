import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { applyDatabaseSupportMigrations } from "../../src/db/bootstrap";
import { createDatabaseClient, type PersonaDatabaseClient } from "../../src/db/client";
import {
  getMemoryById,
  listMemoriesForPersona,
  searchMemoriesForPersona
} from "../../src/db/memories";
import { importDecisionSeedMemories } from "../../src/db/seed";

describe("memory read repository", () => {
  let tempDir: string;
  let client: PersonaDatabaseClient;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "persona-lm-db-memories-"));
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

    applyDatabaseSupportMigrations({ client });
  });

  afterEach(() => {
    client.sqlite.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("hydrates imported decision seed memories back into compiled memory objects", () => {
    importDecisionSeedMemories({
      personaId: "persona_demo",
      client
    });

    const memories = listMemoriesForPersona({
      personaId: "persona_demo",
      client
    });
    const memory = memories.find(
      (item) => item.summary === "운영비와 유지 부담을 기술 선택의 초기에 계산한다"
    );

    expect(memories).toHaveLength(25);
    expect(memory).toMatchObject({
      personaId: "persona_demo",
      kind: "decision_rule",
      confidence: 0.92,
      stability: "stable",
      sourceTypes: ["seed"]
    });
    expect(memory?.metadata).toHaveProperty("importSource", "reviewed_decision_seed");
    expect(memory?.validTo).toBeNull();
  });

  it("can fetch a single memory by id and filter by kind", () => {
    importDecisionSeedMemories({
      personaId: "persona_demo",
      client
    });

    const playbooks = listMemoriesForPersona({
      personaId: "persona_demo",
      kinds: ["decision_playbook"],
      client
    });
    const loaded = getMemoryById({
      id: playbooks[0]?.id ?? "",
      client
    });

    expect(playbooks).toHaveLength(4);
    expect(playbooks.every((memory) => memory.kind === "decision_playbook")).toBe(true);
    expect(loaded?.id).toBe(playbooks[0]?.id);
    expect(loaded?.kind).toBe("decision_playbook");
  });

  it("searches long-term memory candidates through SQLite FTS and respects kind filters", () => {
    importDecisionSeedMemories({
      personaId: "persona_demo",
      client
    });

    const candidates = searchMemoriesForPersona({
      personaId: "persona_demo",
      query: "콘텐츠 버전 관리",
      candidateLimit: 6,
      client
    });
    const playbookCandidates = searchMemoriesForPersona({
      personaId: "persona_demo",
      query: "콘텐츠 버전 관리",
      kinds: ["decision_playbook"],
      candidateLimit: 4,
      client
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(
      candidates.some(
        (memory) => memory.summary === "현재값보다 이력과 복구 가능성을 우선한다"
      )
    ).toBe(true);
    expect(playbookCandidates.length).toBeGreaterThan(0);
    expect(playbookCandidates.every((memory) => memory.kind === "decision_playbook")).toBe(
      true
    );
    expect(
      playbookCandidates.some((memory) =>
        memory.summary.includes("콘텐츠나 외부 원본과의 동기화")
      )
    ).toBe(true);
  });
});
