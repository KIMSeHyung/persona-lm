import { describe, expect, it } from "vitest";

import { retrieveRelevantMemories } from "../../../src/runtime/retrieval/index";
import { createTestCompiledMemory } from "../../helpers/compiled-memory";

describe("retrieveRelevantMemories", () => {
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
});
