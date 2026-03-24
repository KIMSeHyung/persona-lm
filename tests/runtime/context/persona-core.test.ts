import { describe, expect, it } from "vitest";

import { buildPersonaCore } from "../../../src/runtime/context/persona-core";
import { createTestCompiledMemory } from "../../helpers/compiled-memory";

describe("buildPersonaCore", () => {
  it("keeps the highest-confidence memories for each core kind", () => {
    const memories = [
      createTestCompiledMemory({
        id: "style_low",
        kind: "style_rule",
        canonicalText: "낮은 스타일 규칙",
        confidence: 0.2
      }),
      createTestCompiledMemory({
        id: "style_high",
        kind: "style_rule",
        canonicalText: "높은 스타일 규칙",
        confidence: 0.95
      }),
      createTestCompiledMemory({
        id: "style_mid",
        kind: "style_rule",
        canonicalText: "중간 스타일 규칙",
        confidence: 0.7
      }),
      createTestCompiledMemory({
        id: "style_second",
        kind: "style_rule",
        canonicalText: "두 번째 스타일 규칙",
        confidence: 0.8
      }),
      createTestCompiledMemory({
        id: "decision",
        kind: "decision_rule",
        canonicalText: "구조를 먼저 본다",
        confidence: 0.9
      }),
      createTestCompiledMemory({
        id: "value",
        kind: "value",
        canonicalText: "비파괴적 변경을 선호한다",
        confidence: 0.88
      })
    ];

    const core = buildPersonaCore(memories);

    expect(core.styleRules).toEqual([
      "높은 스타일 규칙",
      "두 번째 스타일 규칙",
      "중간 스타일 규칙"
    ]);
    expect(core.decisionRules).toEqual(["구조를 먼저 본다"]);
    expect(core.values).toEqual(["비파괴적 변경을 선호한다"]);
  });
});
