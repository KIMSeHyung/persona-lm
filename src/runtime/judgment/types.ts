import type { MemoryKind } from "../../shared/types/memory";
import type { PersonaExecutionPolicy } from "../config";
import type {
  FeedbackAttemptStrategy,
  FeedbackRetryReason,
  PersonaFeedbackInput
} from "../feedback/index";

export interface QueryJudgment {
  decisionQuery: boolean;
  initialKindWeights?: Partial<Record<MemoryKind, number>>;
  retryKindWeights?: Partial<Record<MemoryKind, number>>;
}

export interface RetryReasonSelectionInput {
  policy: PersonaExecutionPolicy;
  feedback: PersonaFeedbackInput | null;
  initialTopMemoryConfidence: number;
}

export interface RetryPlanInput {
  query: string;
  decisionQuery: boolean;
  feedback: PersonaFeedbackInput | null;
  retryReason: FeedbackRetryReason;
}

export interface RetryPlan {
  strategy: FeedbackAttemptStrategy;
  query: string;
  kindWeights?: Partial<Record<MemoryKind, number>>;
  limit?: number;
}

export interface JudgmentEngine {
  classifyQuery(query: string): QueryJudgment;
  selectRetryReason(input: RetryReasonSelectionInput): FeedbackRetryReason | null;
  planRetry(input: RetryPlanInput): RetryPlan;
}
