import { describe, expect, it } from "vitest";

import {
  scoreCompiledMemory,
  tokenize
} from "../../../src/memory/scoring/index";
import { createTestCompiledMemory } from "../../helpers/compiled-memory";

describe("memory scoring", () => {
  it("tokenizes a query by lowercasing and removing punctuation", () => {
    expect(tokenize("Clarity, control! (Now)")).toEqual([
      "clarity",
      "control",
      "now"
    ]);
  });

  it("returns zero when the query does not match the memory text", () => {
    const memory = createTestCompiledMemory({
      summary: "오픈소스 선호",
      canonicalText: "제품형 서비스보다 오픈소스를 선호한다."
    });

    expect(scoreCompiledMemory(memory, "database migration")).toEqual({
      score: 0,
      matchedTerms: []
    });
  });

  it("combines lexical overlap, confidence, and status into the final score", () => {
    const memory = createTestCompiledMemory({
      summary: "clarity control",
      canonicalText: "clarity first and control over the system",
      tags: ["clarity"],
      scope: ["control"],
      confidence: 0.8,
      status: "confirmed"
    });

    expect(scoreCompiledMemory(memory, "clarity control")).toEqual({
      score: 2.5,
      matchedTerms: ["clarity", "control"]
    });
  });
});
