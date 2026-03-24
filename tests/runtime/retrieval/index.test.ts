import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { applyDatabaseSupportMigrations } from "../../../src/db/bootstrap";
import {
  createDatabaseClient,
  type PersonaDatabaseClient
} from "../../../src/db/client";
import { importDecisionSeedMemories } from "../../../src/db/seed";

import {
  retrieveRelevantMemories,
  retrieveRelevantMemoriesFromStore
} from "../../../src/runtime/retrieval/index";
import { createTestCompiledMemory } from "../../helpers/compiled-memory";

describe("retrieveRelevantMemories", () => {
  let tempDir: string;
  let client: PersonaDatabaseClient;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "persona-lm-runtime-retrieval-"));
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

  it("sorts retrieved memories by score and respects the limit", () => {
    const results = retrieveRelevantMemories({
      query: "clarity control",
      memories: [
        createTestCompiledMemory({
          id: "mem_a",
          summary: "clarity control",
          canonicalText: "clarity control",
          confidence: 0.95,
          status: "confirmed"
        }),
        createTestCompiledMemory({
          id: "mem_b",
          summary: "clarity",
          canonicalText: "clarity",
          confidence: 0.7,
          status: "hypothesis"
        }),
        createTestCompiledMemory({
          id: "mem_c",
          summary: "completely different",
          canonicalText: "different text",
          confidence: 1,
          status: "confirmed"
        })
      ],
      limit: 2
    });

    expect(results).toHaveLength(2);
    expect(results.map((item) => item.memory.id)).toEqual(["mem_a", "mem_b"]);
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("drops zero-score memories and can boost selected kinds", () => {
    const results = retrieveRelevantMemories({
      query: "versioning",
      memories: [
        createTestCompiledMemory({
          id: "playbook",
          kind: "decision_playbook",
          summary: "versioning",
          canonicalText: "versioning procedure",
          confidence: 0.5,
          status: "confirmed"
        }),
        createTestCompiledMemory({
          id: "preference",
          kind: "preference",
          summary: "versioning",
          canonicalText: "versioning preference",
          confidence: 0.8,
          status: "confirmed"
        }),
        createTestCompiledMemory({
          id: "irrelevant",
          kind: "value",
          summary: "different",
          canonicalText: "different topic",
          confidence: 1,
          status: "confirmed"
        })
      ],
      kindWeights: {
        decision_playbook: 0.5
      },
      limit: 5
    });

    expect(results.map((item) => item.memory.id)).toEqual(["playbook", "preference"]);
  });

  it("retrieves DB-backed long-term memory candidates and reranks them after FTS selection", () => {
    importDecisionSeedMemories({
      personaId: "persona_demo",
      client
    });

    const results = retrieveRelevantMemoriesFromStore({
      personaId: "persona_demo",
      query: "동시성 락 idempotency",
      kinds: ["decision_rule", "decision_playbook", "value"],
      candidateLimit: 8,
      limit: 3,
      client
    });

    expect(results).toHaveLength(3);
    expect(results[0]?.memory.summary).toBe("동시성 위험과 중복 실행 비용을 기능보다 먼저 본다");
    expect(results[0]?.matchedTerms).toEqual(
      expect.arrayContaining(["동시성", "락"])
    );
    expect(results.some((item) => item.memory.kind === "decision_playbook")).toBe(true);
  });
});
