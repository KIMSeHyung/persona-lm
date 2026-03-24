import { describe, expect, it } from "vitest";

import { buildDecisionSeedMemories } from "../../../src/seeds/persona/decision-seed";

describe("buildDecisionSeedMemories", () => {
  it("builds the reviewed decision seed set with stable kind counts", () => {
    const memories = buildDecisionSeedMemories("persona_demo");
    const counts = memories.reduce<Record<string, number>>((acc, memory) => {
      acc[memory.kind] = (acc[memory.kind] ?? 0) + 1;
      return acc;
    }, {});

    expect(memories).toHaveLength(25);
    expect(counts).toEqual({
      decision_rule: 7,
      decision_playbook: 4,
      decision_trace: 7,
      value: 7
    });
  });

  it("builds stable ids and retrieval-friendly playbook text", () => {
    const firstBuild = buildDecisionSeedMemories("persona_demo");
    const secondBuild = buildDecisionSeedMemories("persona_demo");
    const playbook = firstBuild.find((memory) => memory.kind === "decision_playbook");

    expect(firstBuild.map((memory) => memory.id)).toEqual(
      secondBuild.map((memory) => memory.id)
    );
    expect(playbook?.canonicalText).toContain("판단 절차:");
  });
});
