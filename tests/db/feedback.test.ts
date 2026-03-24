import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabaseClient, type PersonaDatabaseClient } from "../../src/db/client";
import {
  listFeedbackRunsForPersona,
  persistFeedbackRun
} from "../../src/db/feedback";
import { runFeedbackPipeline } from "../../src/runtime/feedback/index";
import { createTestCompiledMemory } from "../helpers/compiled-memory";

describe("feedback run persistence", () => {
  let tempDir: string;
  let client: PersonaDatabaseClient;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "persona-lm-feedback-db-"));
    client = createDatabaseClient(tempDir);

    client.sqlite.exec(`
      CREATE TABLE personas (
        id TEXT PRIMARY KEY NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL
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

    client.sqlite
      .prepare(
        `
          INSERT INTO personas (id, slug, display_name, description, created_at)
          VALUES (?, ?, ?, ?, ?)
        `
      )
      .run(
        "persona_demo",
        "persona-demo",
        "Persona Demo",
        "test persona",
        Date.now()
      );
  });

  afterEach(() => {
    client.sqlite.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("stores a feedback pipeline run and rehydrates it from SQLite", () => {
    const run = runFeedbackPipeline({
      personaId: "persona_demo",
      query: "콘텐츠 버전 관리를 어떻게 판단해?",
      mode: "dev_feedback",
      memories: [
        createTestCompiledMemory({
          id: "mem_playbook",
          kind: "decision_playbook",
          summary: "콘텐츠 버전 관리 판단 절차",
          canonicalText: "콘텐츠 버전 관리 판단 절차와 예외 조건",
          confidence: 0.93,
          scope: ["cms_versioning"],
          tags: ["버전", "관리", "예외"]
        })
      ],
      feedback: {
        score: 0.4,
        reason: "missing_memory",
        missingAspect: "예외 조건"
      }
    });

    persistFeedbackRun({
      run,
      client
    });

    const rows = listFeedbackRunsForPersona({
      personaId: "persona_demo",
      client
    });
    const storedRow = client.sqlite
      .prepare(
        "SELECT feedback_score AS feedbackScore, retry_triggered AS retryTriggered, metadata_json AS metadataJson FROM feedback_runs WHERE id = ?"
      )
      .get(run.id) as {
      feedbackScore: number;
      retryTriggered: number;
      metadataJson: string;
    };

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: run.id,
      personaId: "persona_demo",
      retryTriggered: true,
      retryReason: "user_feedback",
      finalAttemptNumber: 2
    });
    expect(rows[0].attempts).toHaveLength(2);
    expect(storedRow.feedbackScore).toBe(400);
    expect(storedRow.retryTriggered).toBe(1);
    expect(storedRow.metadataJson).toContain('"strategy":"retry_user_feedback"');
  });
});
