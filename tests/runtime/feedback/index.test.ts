import { describe, expect, it } from "vitest";

import { runFeedbackPipeline } from "../../../src/runtime/feedback/index";
import type { JudgmentEngine } from "../../../src/runtime/judgment";
import { createTestCompiledMemory } from "../../helpers/compiled-memory";

describe("runFeedbackPipeline", () => {
  it("retries when dev feedback mode receives a low score with a missing aspect", () => {
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
        }),
        createTestCompiledMemory({
          id: "mem_rule",
          kind: "decision_rule",
          summary: "복구 가능성을 우선한다",
          canonicalText: "현재값보다 이력과 복구 가능성을 우선한다",
          confidence: 0.97,
          scope: ["cms_versioning"],
          tags: ["복구", "이력"]
        })
      ],
      feedback: {
        score: 0.35,
        reason: "missing_memory",
        missingAspect: "예외 조건"
      }
    });

    expect(run.decisionQuery).toBe(true);
    expect(run.retryTriggered).toBe(true);
    expect(run.retryReason).toBe("user_feedback");
    expect(run.attempts).toHaveLength(2);
    expect(run.attempts[0].strategy).toBe("initial");
    expect(run.attempts[1].strategy).toBe("retry_user_feedback");
    expect(run.attempts[1].query).toContain("예외 조건");
    expect(run.finalAttemptNumber).toBe(2);
  });

  it("can retry automatically when top memory confidence is too low", () => {
    const run = runFeedbackPipeline({
      personaId: "persona_demo",
      query: "생각 정리를 어떻게 하는 편이야",
      mode: "auto",
      memories: [
        createTestCompiledMemory({
          id: "mem_low_confidence",
          kind: "preference",
          summary: "생각 정리 습관",
          canonicalText: "생각 정리는 글로 적어보며 한다",
          confidence: 0.42,
          tags: ["생각", "정리"]
        })
      ]
    });

    expect(run.retryTriggered).toBe(true);
    expect(run.retryReason).toBe("low_confidence");
    expect(run.attempts).toHaveLength(2);
    expect(run.attempts[1].strategy).toBe("retry_low_confidence");
    expect(run.finalAttemptNumber).toBe(2);
  });

  it("does not retry in locked mode even when feedback is low", () => {
    const run = runFeedbackPipeline({
      personaId: "persona_demo",
      query: "콘텐츠 버전 관리를 어떻게 판단해?",
      mode: "locked",
      memories: [
        createTestCompiledMemory({
          id: "mem_playbook",
          kind: "decision_playbook",
          summary: "콘텐츠 버전 관리 판단 절차",
          canonicalText: "콘텐츠 버전 관리 판단 절차",
          confidence: 0.93,
          scope: ["cms_versioning"],
          tags: ["버전", "관리"]
        })
      ],
      feedback: {
        score: 0.2,
        reason: "wrong_priority",
        missingAspect: "예외 조건"
      }
    });

    expect(run.retryTriggered).toBe(false);
    expect(run.retryReason).toBeNull();
    expect(run.attempts).toHaveLength(1);
    expect(run.finalAttemptNumber).toBe(1);
  });

  it("can accept a custom judgment engine so the heuristic can be replaced later", () => {
    const customJudgmentEngine: JudgmentEngine = {
      classifyQuery() {
        return {
          decisionQuery: false,
          initialKindWeights: undefined,
          retryKindWeights: undefined
        };
      },
      selectRetryReason() {
        return "user_feedback";
      },
      planRetry() {
        return {
          strategy: "retry_user_feedback",
          query: "커스텀 재시도 쿼리",
          kindWeights: undefined,
          limit: 7
        };
      }
    };

    const run = runFeedbackPipeline({
      personaId: "persona_demo",
      query: "테스트 쿼리",
      mode: "dev_feedback",
      memories: [
        createTestCompiledMemory({
          id: "mem_custom",
          summary: "테스트 쿼리",
          canonicalText: "테스트 쿼리"
        })
      ],
      feedback: {
        score: 0.2,
        reason: "other"
      },
      judgmentEngine: customJudgmentEngine
    });

    expect(run.retryTriggered).toBe(true);
    expect(run.attempts[1]?.query).toBe("커스텀 재시도 쿼리");
    expect(run.attempts[1]?.strategy).toBe("retry_user_feedback");
  });
});
