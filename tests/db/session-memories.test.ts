import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabaseClient, type PersonaDatabaseClient } from "../../src/db/client";
import { saveSessionMemories } from "../../src/db/session-memories";

describe("saveSessionMemories", () => {
  let tempDir: string;
  let client: PersonaDatabaseClient;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "persona-lm-session-memories-"));
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

  it("saves session-derived memories as hypothesis/emerging llm_chat memories", () => {
    const result = saveSessionMemories({
      personaId: "persona_demo",
      sessionId: "session_1",
      candidates: [
        {
          kind: "decision_rule",
          summary: "로그보다 구조를 먼저 정리한다",
          canonicalText: "문제가 커지면 로그를 늘리기보다 구조를 먼저 정리하는 편이다.",
          confidence: 0.72,
          scope: ["system_design"],
          tags: ["system_design", "structure_first"],
          supportingEvidence: ["구조를 먼저 정리하고 보자고 여러 번 말했다."]
        }
      ],
      client
    });

    const savedRow = client.sqlite
      .prepare(
        "SELECT status, stability, confidence, source_types_json AS sourceTypesJson, metadata_json AS metadataJson FROM memories WHERE summary = ?"
      )
      .get("로그보다 구조를 먼저 정리한다") as {
      status: string;
      stability: string;
      confidence: number;
      sourceTypesJson: string;
      metadataJson: string;
    };

    expect(result.savedCount).toBe(1);
    expect(result.updatedCount).toBe(0);
    expect(result.items).toEqual([
      expect.objectContaining({
        kind: "decision_rule",
        status: "hypothesis",
        stability: "emerging"
      })
    ]);
    expect(savedRow.status).toBe("hypothesis");
    expect(savedRow.stability).toBe("emerging");
    expect(savedRow.confidence).toBe(720);
    expect(savedRow.sourceTypesJson).toContain("llm_chat");
    expect(savedRow.metadataJson).toContain('"importSource":"session_memory_save"');
    expect(savedRow.metadataJson).toContain('"sessionId":"session_1"');
  });

  it("auto-promotes low-risk memories when the same kind and summary repeat across sessions", () => {
    saveSessionMemories({
      personaId: "persona_demo",
      sessionId: "session_1",
      candidates: [
        {
          kind: "value",
          summary: "작게 검증하고 넓힌다",
          canonicalText: "처음부터 넓게 열기보다 작은 범위에서 검증한 뒤 확장하는 편이다.",
          confidence: 0.61,
          tags: ["incremental_validation"]
        }
      ],
      client
    });
    const second = saveSessionMemories({
      personaId: "persona_demo",
      sessionId: "session_2",
      candidates: [
        {
          kind: "value",
          summary: "작게 검증하고 넓힌다",
          canonicalText:
            "처음에는 작은 범위에서 검증하고, 근거가 쌓이면 점진적으로 확장하는 편이다.",
          confidence: 0.84,
          tags: ["incremental_validation", "risk_control"]
        }
      ],
      client
    });

    const rowCount = client.sqlite
      .prepare("SELECT COUNT(*) AS count FROM memories WHERE summary = ?")
      .get("작게 검증하고 넓힌다") as { count: number };
    const updatedRow = client.sqlite
      .prepare(
        "SELECT status, stability, confidence, tags_json AS tagsJson, metadata_json AS metadataJson FROM memories WHERE summary = ?"
      )
      .get("작게 검증하고 넓힌다") as {
      status: string;
      stability: string;
      confidence: number;
      tagsJson: string;
      metadataJson: string;
    };

    expect(second.savedCount).toBe(0);
    expect(second.updatedCount).toBe(1);
    expect(rowCount.count).toBe(1);
    expect(second.items).toEqual([
      expect.objectContaining({
        kind: "value",
        status: "confirmed",
        stability: "stable"
      })
    ]);
    expect(updatedRow.status).toBe("confirmed");
    expect(updatedRow.stability).toBe("stable");
    expect(updatedRow.confidence).toBe(840);
    expect(updatedRow.tagsJson).toContain("risk_control");
    expect(updatedRow.metadataJson).toContain('"sessionSaveCount":2');
  });

  it("keeps event-like memories weak even when the same summary repeats", () => {
    saveSessionMemories({
      personaId: "persona_demo",
      sessionId: "session_1",
      candidates: [
        {
          kind: "decision_trace",
          summary: "배포 직전 스키마 변경을 미뤘다",
          canonicalText:
            "배포 직전에 스키마 변경 리스크가 커서, 지금은 변경보다 롤백 가능성을 먼저 확보하는 판단을 했다.",
          confidence: 0.7
        }
      ],
      client
    });
    const second = saveSessionMemories({
      personaId: "persona_demo",
      sessionId: "session_2",
      candidates: [
        {
          kind: "decision_trace",
          summary: "배포 직전 스키마 변경을 미뤘다",
          canonicalText:
            "배포 직전에는 스키마 변경보다 안전한 롤백 경로 확보를 먼저 택했다.",
          confidence: 0.74
        }
      ],
      client
    });

    const updatedRow = client.sqlite
      .prepare(
        "SELECT status, stability, metadata_json AS metadataJson FROM memories WHERE summary = ?"
      )
      .get("배포 직전 스키마 변경을 미뤘다") as {
      status: string;
      stability: string;
      metadataJson: string;
    };

    expect(second.items).toEqual([
      expect.objectContaining({
        kind: "decision_trace",
        status: "hypothesis",
        stability: "emerging"
      })
    ]);
    expect(updatedRow.status).toBe("hypothesis");
    expect(updatedRow.stability).toBe("emerging");
    expect(updatedRow.metadataJson).toContain('"sessionSaveCount":2');
  });
});
