import { describe, expect, it } from "vitest";

import { formatPersonaContext } from "../../../src/runtime/prompt/index";
import type { PersonaCore } from "../../../src/runtime/context/persona-core";
import { createTestCompiledMemory } from "../../helpers/compiled-memory";

describe("formatPersonaContext", () => {
  it("renders persona core sections and retrieved memories into a prompt block", () => {
    const core: PersonaCore = {
      styleRules: ["핵심부터 말한다"],
      decisionRules: ["구조를 먼저 본다"],
      values: ["복구 가능성을 우선한다"],
      preferences: ["오픈소스를 선호한다"],
      selfDescriptions: ["직접적이고 구조적인 편이다"]
    };
    const prompt = formatPersonaContext(core, [
      {
        memory: createTestCompiledMemory({
          kind: "decision_playbook",
          canonicalText: "버전 관리 판단 절차를 따른다"
        }),
        score: 2.1,
        matchedTerms: ["버전", "관리"]
      }
    ]);

    expect(prompt).toContain("[persona-core]");
    expect(prompt).toContain("- style: 핵심부터 말한다");
    expect(prompt).toContain("- decision: 구조를 먼저 본다");
    expect(prompt).toContain("[retrieved-memories]");
    expect(prompt).toContain("- (decision_playbook) 버전 관리 판단 절차를 따른다");
  });
});
