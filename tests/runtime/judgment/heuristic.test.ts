import { describe, expect, it } from "vitest";

import {
  createHeuristicJudgmentEngine
} from "../../../src/runtime/judgment";
import { resolvePersonaExecutionPolicy } from "../../../src/runtime/config";

describe("heuristic judgment engine", () => {
  it("classifies decision-oriented queries and provides initial kind weights", () => {
    const engine = createHeuristicJudgmentEngine();
    const judgment = engine.classifyQuery("콘텐츠 버전 관리를 어떻게 판단해?");

    expect(judgment.decisionQuery).toBe(true);
    expect(judgment.initialKindWeights?.decision_playbook).toBeGreaterThan(0);
    expect(judgment.retryKindWeights?.decision_rule).toBeGreaterThan(0);
  });

  it("selects a retry reason from low feedback or low confidence", () => {
    const engine = createHeuristicJudgmentEngine();

    expect(
      engine.selectRetryReason({
        policy: resolvePersonaExecutionPolicy("dev_feedback"),
        feedback: {
          score: 0.3,
          reason: "missing_memory",
          missingAspect: "예외 조건"
        },
        initialTopMemoryConfidence: 0.95
      })
    ).toBe("user_feedback");

    expect(
      engine.selectRetryReason({
        policy: resolvePersonaExecutionPolicy("auto"),
        feedback: null,
        initialTopMemoryConfidence: 0.4
      })
    ).toBe("low_confidence");
  });

  it("builds a retry plan that stays extensible behind the judgment interface", () => {
    const engine = createHeuristicJudgmentEngine();
    const retryPlan = engine.planRetry({
      query: "콘텐츠 버전 관리를 어떻게 판단해?",
      decisionQuery: true,
      feedback: {
        score: 0.3,
        reason: "wrong_priority",
        missingAspect: "예외 조건"
      },
      retryReason: "user_feedback"
    });

    expect(retryPlan.strategy).toBe("retry_user_feedback");
    expect(retryPlan.query).toContain("예외 조건");
    expect(retryPlan.query).toContain("판단 기준");
    expect(retryPlan.kindWeights?.decision_playbook).toBeGreaterThan(0);
  });
});
