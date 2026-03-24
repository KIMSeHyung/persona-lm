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
import { buildDecisionContextFromStore } from "../../../src/runtime/context/decision-context";

describe("buildDecisionContextFromStore", () => {
  let tempDir: string;
  let client: PersonaDatabaseClient;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "persona-lm-decision-context-"));
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
    importDecisionSeedMemories({
      personaId: "persona_demo",
      client
    });
  });

  afterEach(() => {
    client.sqlite.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns persona core plus grouped decision memories for a decision query", () => {
    const context = buildDecisionContextFromStore({
      personaId: "persona_demo",
      query: "콘텐츠 버전 관리 복구",
      client
    });

    expect(context.personaId).toBe("persona_demo");
    expect(context.query).toBe("콘텐츠 버전 관리 복구");
    expect(context.personaCore.decisionRules).toContain(
      "데이터나 콘텐츠 구조를 다룰 때, 현재 상태를 단순 덮어쓰는 방식보다 이력 보존, 복구 가능성, 발행본과 작업본의 분리처럼 손실을 줄이는 방향을 반복적으로 선호한다."
    );
    expect(context.playbooks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          summary:
            "콘텐츠나 외부 원본과의 동기화 문제에서는 덮어쓰기보다 상태 비교, 버전 생성, 단계적 반영을 우선하는 절차가 보인다.",
          steps: expect.arrayContaining([
            "현재 로컬 상태와 원본 상태를 구조 단위로 비교한다."
          ])
        })
      ])
    );
    expect(context.rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          summary: "현재값보다 이력과 복구 가능성을 우선한다"
        })
      ])
    );
    expect(context.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          summary: "이력 보존과 복구 가능성을 우선한다"
        })
      ])
    );
    expect(context.usedMemoryIds.length).toBeGreaterThan(0);
  });
});
