import type { CompiledMemory } from "../../src/shared/types/memory";

export function createTestCompiledMemory(
  overrides: Partial<CompiledMemory> = {}
): CompiledMemory {
  return {
    id: "mem_test",
    personaId: "persona_demo",
    kind: "preference",
    summary: "테스트 메모리 요약",
    canonicalText: "테스트 메모리 본문",
    status: "confirmed",
    confidence: 0.8,
    stability: "stable",
    scope: ["general"],
    tags: ["general"],
    sourceTypes: ["seed"],
    evidenceIds: [],
    metadata: {},
    createdAt: "2026-03-24T00:00:00.000Z",
    updatedAt: "2026-03-24T00:00:00.000Z",
    validFrom: "2026-03-24T00:00:00.000Z",
    validTo: null,
    ...overrides
  };
}
