import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { applyDatabaseSupportMigrations } from "../../src/db/bootstrap";
import {
  createDatabaseClient,
  type PersonaDatabaseClient
} from "../../src/db/client";
import { importDecisionSeedMemories } from "../../src/db/seed";

describe("MCP stdio server integration", () => {
  let tempDir: string;
  let client: PersonaDatabaseClient;
  let mcpClient: Client;
  let transport: StdioClientTransport;

  beforeEach(async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), "persona-lm-mcp-stdio-"));
    client = createDatabaseClient(tempDir);

    client.sqlite.exec(`
      CREATE TABLE personas (
        id TEXT PRIMARY KEY NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE evidence (
        id TEXT PRIMARY KEY NOT NULL,
        artifact_id TEXT NOT NULL,
        persona_id TEXT NOT NULL,
        source_type TEXT NOT NULL,
        channel TEXT NOT NULL,
        authored_by_self INTEGER NOT NULL,
        author_label TEXT NOT NULL,
        content TEXT NOT NULL,
        room_id TEXT,
        tags_json TEXT,
        metadata_json TEXT,
        created_at INTEGER
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

      CREATE TABLE feedback_runs (
        id TEXT PRIMARY KEY NOT NULL,
        persona_id TEXT NOT NULL,
        session_id TEXT,
        mode TEXT NOT NULL,
        query TEXT NOT NULL,
        decision_query INTEGER NOT NULL,
        feedback_score INTEGER,
        feedback_reason TEXT,
        missing_aspect TEXT,
        retry_triggered INTEGER NOT NULL,
        retry_reason TEXT,
        attempt_count INTEGER NOT NULL,
        final_attempt_number INTEGER NOT NULL,
        metadata_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    applyDatabaseSupportMigrations({ client });
    importDecisionSeedMemories({
      personaId: "persona_demo",
      client
    });

    client.sqlite
      .prepare(
        `
          INSERT INTO evidence (
            id,
            artifact_id,
            persona_id,
            source_type,
            channel,
            authored_by_self,
            author_label,
            content,
            room_id,
            tags_json,
            metadata_json,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        "ev_1",
        "artifact_1",
        "persona_demo",
        "notes",
        "daily-notes",
        1,
        "self",
        "락과 idempotency를 먼저 본다",
        null,
        "[\"concurrency\"]",
        "{}",
        Date.now()
      );
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
        "mem_with_evidence",
        "persona_demo",
        "decision_rule",
        "락과 idempotency를 먼저 검토한다",
        "락과 idempotency를 먼저 검토한다",
        "confirmed",
        930,
        "stable",
        "[\"concurrency\"]",
        "[\"concurrency\"]",
        "[\"notes\"]",
        "[\"ev_1\"]",
        "{}",
        Date.now(),
        Date.now(),
        null,
        null
      );

    transport = new StdioClientTransport({
      command: process.execPath,
      args: [
        "--import",
        path.resolve(process.cwd(), "node_modules/tsx/dist/loader.mjs"),
        path.resolve(process.cwd(), "src/mcp/stdio.ts"),
        "--mode",
        "dev_feedback"
      ],
      cwd: tempDir,
      stderr: "pipe"
    });
    mcpClient = new Client({
      name: "persona-lm-test-client",
      version: "0.1.0"
    });

    await mcpClient.connect(transport);
  });

  afterEach(async () => {
    await mcpClient?.close();
    client?.sqlite.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists the declared tools through the SDK-backed stdio server", async () => {
    const result = await mcpClient.listTools();

    expect(result.tools.map((tool) => tool.name)).toEqual([
      "search_memories",
      "get_decision_context",
      "get_memory_evidence",
      "get_persona_core",
      "get_session_summary",
      "submit_feedback"
    ]);
  });

  it("serves DB-backed memory search, decision context, and persona core tools", async () => {
    const searchResult = await mcpClient.callTool({
      name: "search_memories",
      arguments: {
        query: "동시성 락 idempotency",
        topK: 3
      }
    });
    const decisionContextResult = await mcpClient.callTool({
      name: "get_decision_context",
      arguments: {
        query: "콘텐츠 버전 관리 복구"
      }
    });
    const coreResult = await mcpClient.callTool({
      name: "get_persona_core",
      arguments: {}
    });

    expect(searchResult.isError).not.toBe(true);
    expect(searchResult.structuredContent).toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({
          summary: "동시성 위험과 중복 실행 비용을 기능보다 먼저 본다"
        })
      ])
    });
    expect(decisionContextResult.isError).not.toBe(true);
    expect(decisionContextResult.structuredContent).toMatchObject({
      personaId: "persona_demo",
      query: "콘텐츠 버전 관리 복구",
      personaCore: {
        decisionRules: expect.any(Array),
        values: expect.any(Array)
      },
      playbooks: expect.arrayContaining([
        expect.objectContaining({
          summary:
            "콘텐츠나 외부 원본과의 동기화 문제에서는 덮어쓰기보다 상태 비교, 버전 생성, 단계적 반영을 우선하는 절차가 보인다."
        })
      ]),
      rules: expect.arrayContaining([
        expect.objectContaining({
          summary: "현재값보다 이력과 복구 가능성을 우선한다"
        })
      ]),
      values: expect.arrayContaining([
        expect.objectContaining({
          summary: "이력 보존과 복구 가능성을 우선한다"
        })
      ]),
      usedMemoryIds: expect.any(Array)
    });
    expect(coreResult.isError).not.toBe(true);
    expect(coreResult.structuredContent).toMatchObject({
      personaId: "persona_demo",
      decisionRules: expect.any(Array),
      values: expect.any(Array)
    });
  });

  it("returns evidence rows, empty session summary, and persists feedback runs", async () => {
    const evidenceResult = await mcpClient.callTool({
      name: "get_memory_evidence",
      arguments: {
        memoryId: "mem_with_evidence"
      }
    });
    const sessionResult = await mcpClient.callTool({
      name: "get_session_summary",
      arguments: {
        sessionId: "session_demo"
      }
    });
    const feedbackResult = await mcpClient.callTool({
      name: "submit_feedback",
      arguments: {
        query: "콘텐츠 버전 관리를 어떻게 판단하는 편인지",
        score: 0.42,
        reason: "missing_memory",
        missingAspect: "예외 조건",
        sessionId: "session_demo"
      }
    });
    const feedbackRunCount = client.sqlite
      .prepare("SELECT COUNT(*) AS count FROM feedback_runs")
      .get() as { count: number };

    expect(evidenceResult.structuredContent).toMatchObject({
      memoryId: "mem_with_evidence",
      evidence: [
        expect.objectContaining({
          id: "ev_1",
          channel: "daily-notes"
        })
      ]
    });
    expect(sessionResult.structuredContent).toMatchObject({
      sessionId: "session_demo",
      available: false,
      summary: null
    });
    expect(feedbackResult.structuredContent).toMatchObject({
      retryTriggered: true,
      finalAttemptNumber: 2
    });
    expect(feedbackRunCount.count).toBe(1);
  });
});
