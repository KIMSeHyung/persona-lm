import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCompiledMemory,
  createMemoryCandidate,
  promoteCandidateToMemory
} from "../../src/memory/models";

describe("memory models", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a memory candidate with default status and stability", () => {
    const candidate = createMemoryCandidate({
      personaId: "persona_demo",
      kind: "preference",
      summary: "오픈소스 선호",
      canonicalText: "제품형 서비스보다 오픈소스를 선호한다.",
      confidence: 0.72,
      sourceTypes: ["messenger"],
      evidenceIds: ["ev_1"]
    });

    expect(candidate).toMatchObject({
      personaId: "persona_demo",
      kind: "preference",
      status: "hypothesis",
      stability: "emerging",
      scope: [],
      tags: [],
      sourceTypes: ["messenger"],
      evidenceIds: ["ev_1"],
      createdAt: "2026-03-24T00:00:00.000Z",
      updatedAt: "2026-03-24T00:00:00.000Z"
    });
    expect(candidate.id).toMatch(/^cand_/);
  });

  it("promotes a candidate into a compiled memory while preserving the id", () => {
    const candidate = createMemoryCandidate({
      personaId: "persona_demo",
      kind: "decision_rule",
      summary: "구조 우선",
      canonicalText: "구조적 명확성과 통제 가능성을 우선한다.",
      confidence: 0.77,
      sourceTypes: ["messenger"],
      evidenceIds: ["ev_2"],
      status: "confirmed"
    });
    const memory = promoteCandidateToMemory({
      candidate,
      validFrom: candidate.createdAt
    });

    expect(memory.id).toBe(candidate.id);
    expect(memory.validFrom).toBe(candidate.createdAt);
    expect(memory.validTo).toBeNull();
  });

  it("creates a compiled memory with sensible defaults", () => {
    const memory = createCompiledMemory({
      personaId: "persona_demo",
      kind: "value",
      summary: "핵심 위주 설명",
      canonicalText: "핵심을 먼저 설명한다.",
      status: "confirmed",
      confidence: 0.9
    });

    expect(memory).toMatchObject({
      personaId: "persona_demo",
      kind: "value",
      stability: "emerging",
      scope: [],
      tags: [],
      sourceTypes: [],
      evidenceIds: [],
      metadata: {},
      createdAt: "2026-03-24T00:00:00.000Z",
      updatedAt: "2026-03-24T00:00:00.000Z",
      validFrom: null,
      validTo: null
    });
    expect(memory.id).toMatch(/^mem_/);
  });
});
