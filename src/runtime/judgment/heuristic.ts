import type { MemoryKind } from "../../shared/types/memory";
import type { PersonaFeedbackInput } from "../feedback/index";
import type { JudgmentEngine } from "./types";

const decisionQueryPatterns = [
  "판단",
  "선택",
  "왜",
  "이유",
  "기준",
  "절차",
  "예외",
  "version",
  "동시성",
  "버전 관리"
];

const decisionInitialKindWeights: Partial<Record<MemoryKind, number>> = {
  decision_playbook: 0.4,
  decision_rule: 0.25,
  value: 0.15,
  decision_trace: 0.1
};

const decisionRetryKindWeights: Partial<Record<MemoryKind, number>> = {
  decision_playbook: 0.55,
  decision_rule: 0.35,
  value: 0.2,
  decision_trace: 0.15,
  episodic_memory: 0.1
};

/**
 * Creates the default heuristic judgment engine used during development.
 */
export function createHeuristicJudgmentEngine(): JudgmentEngine {
  return {
    classifyQuery(query) {
      const decisionQuery = isDecisionOrientedQuery(query);

      return {
        decisionQuery,
        initialKindWeights: decisionQuery ? decisionInitialKindWeights : undefined,
        retryKindWeights: decisionQuery ? decisionRetryKindWeights : undefined
      };
    },

    selectRetryReason(input) {
      if (
        input.feedback !== null &&
        input.policy.allowUserFeedback &&
        input.policy.allowRetryOnLowScore &&
        input.feedback.score < input.policy.minFeedbackScoreForAcceptance
      ) {
        return "user_feedback";
      }

      if (
        input.policy.allowRetryOnLowScore &&
        input.initialTopMemoryConfidence < input.policy.minConfidenceForNoTool
      ) {
        return "low_confidence";
      }

      return null;
    },

    planRetry(input) {
      return {
        strategy:
          input.retryReason === "user_feedback"
            ? "retry_user_feedback"
            : "retry_low_confidence",
        query: buildRetryQuery({
          query: input.query,
          feedback: input.feedback,
          decisionQuery: input.decisionQuery
        }),
        kindWeights: input.decisionQuery ? decisionRetryKindWeights : undefined
      };
    }
  };
}

function isDecisionOrientedQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase();

  return decisionQueryPatterns.some((pattern) =>
    normalizedQuery.includes(pattern.toLowerCase())
  );
}

function buildRetryQuery(input: {
  query: string;
  feedback: PersonaFeedbackInput | null;
  decisionQuery: boolean;
}): string {
  const segments = [input.query];

  if (input.feedback?.missingAspect !== undefined && input.feedback.missingAspect !== null) {
    segments.push(input.feedback.missingAspect);
  }

  if (input.decisionQuery) {
    segments.push("판단 절차");

    if (input.feedback?.reason === "wrong_priority") {
      segments.push("판단 기준");
    }

    if (input.feedback?.reason === "missing_memory") {
      segments.push("예외 조건");
    }
  } else {
    segments.push("관련 기억");

    if (input.feedback?.reason === "style_mismatch") {
      segments.push("표현 방식");
    }
  }

  return [...new Set(segments.filter((segment) => segment.trim().length > 0))].join(" ");
}
