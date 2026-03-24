import { createId } from "../../shared/ids";
import type {
  CompiledMemory,
  MemoryKind,
  RetrievedMemory
} from "../../shared/types/memory";
import {
  resolvePersonaExecutionPolicy,
  type PersonaExecutionMode
} from "../config";
import {
  createHeuristicJudgmentEngine,
  type JudgmentEngine
} from "../judgment/index";
import { retrieveRelevantMemories } from "../retrieval/index";

export const feedbackReasons = [
  "missing_memory",
  "wrong_priority",
  "too_confident",
  "style_mismatch",
  "other"
] as const;

export type FeedbackReason = (typeof feedbackReasons)[number];
export type FeedbackRetryReason = "user_feedback" | "low_confidence";
export type FeedbackAttemptStrategy =
  | "initial"
  | "retry_user_feedback"
  | "retry_low_confidence";

export interface PersonaFeedbackInput {
  score: number;
  reason: FeedbackReason;
  missingAspect?: string | null;
  note?: string;
}

export interface FeedbackRetrievedMemorySnapshot {
  memoryId: string;
  kind: MemoryKind;
  summary: string;
  score: number;
  confidence: number;
  matchedTerms: string[];
}

export interface FeedbackPipelineAttempt {
  attemptNumber: number;
  query: string;
  strategy: FeedbackAttemptStrategy;
  topRetrievedScore: number;
  topMemoryConfidence: number;
  retrievedMemories: FeedbackRetrievedMemorySnapshot[];
}

export interface FeedbackPipelineRun {
  id: string;
  personaId: string;
  sessionId: string | null;
  mode: PersonaExecutionMode;
  query: string;
  decisionQuery: boolean;
  feedback: PersonaFeedbackInput | null;
  retryTriggered: boolean;
  retryReason: FeedbackRetryReason | null;
  attempts: FeedbackPipelineAttempt[];
  finalAttemptNumber: number;
  createdAt: string;
}

interface RunFeedbackPipelineInput {
  personaId: string;
  query: string;
  memories: CompiledMemory[];
  mode?: PersonaExecutionMode;
  sessionId?: string | null;
  feedback?: PersonaFeedbackInput | null;
  initialLimit?: number;
  retryLimit?: number;
  judgmentEngine?: JudgmentEngine;
}

/**
 * Runs the initial retrieval pass and an optional single retry driven by feedback or low confidence.
 */
export function runFeedbackPipeline(
  input: RunFeedbackPipelineInput
): FeedbackPipelineRun {
  const mode = input.mode ?? "auto";
  const policy = resolvePersonaExecutionPolicy(mode);
  const judgmentEngine = input.judgmentEngine ?? createHeuristicJudgmentEngine();
  const queryJudgment = judgmentEngine.classifyQuery(input.query);
  const normalizedFeedback = normalizeFeedbackInput(input.feedback ?? null);
  const attempts: FeedbackPipelineAttempt[] = [];

  attempts.push(
    buildFeedbackAttempt({
      attemptNumber: 1,
      strategy: "initial",
      query: input.query,
      memories: input.memories,
      limit: input.initialLimit ?? 5,
      kindWeights: queryJudgment.initialKindWeights
    })
  );

  const retryReason = judgmentEngine.selectRetryReason({
    policy,
    feedback: normalizedFeedback,
    initialTopMemoryConfidence: attempts[0].topMemoryConfidence
  });

  if (retryReason !== null && policy.maxToolRounds > 0) {
    const retryPlan = judgmentEngine.planRetry({
      query: input.query,
      decisionQuery: queryJudgment.decisionQuery,
      feedback: normalizedFeedback,
      retryReason
    });

    attempts.push(
      buildFeedbackAttempt({
        attemptNumber: 2,
        strategy: retryPlan.strategy,
        query: retryPlan.query,
        memories: input.memories,
        limit:
          retryPlan.limit ??
          input.retryLimit ??
          Math.max(input.initialLimit ?? 5, 8),
        kindWeights: retryPlan.kindWeights
      })
    );
  }

  return {
    id: createId("feedback"),
    personaId: input.personaId,
    sessionId: input.sessionId ?? null,
    mode,
    query: input.query,
    decisionQuery: queryJudgment.decisionQuery,
    feedback: normalizedFeedback,
    retryTriggered: attempts.length > 1,
    retryReason: attempts.length > 1 ? retryReason : null,
    attempts,
    finalAttemptNumber: attempts.length,
    createdAt: new Date().toISOString()
  };
}

function buildFeedbackAttempt(input: {
  attemptNumber: number;
  strategy: FeedbackAttemptStrategy;
  query: string;
  memories: CompiledMemory[];
  limit: number;
  kindWeights?: Partial<Record<MemoryKind, number>>;
}): FeedbackPipelineAttempt {
  const retrievedMemories = retrieveRelevantMemories({
    query: input.query,
    memories: input.memories,
    limit: input.limit,
    kindWeights: input.kindWeights
  });

  return {
    attemptNumber: input.attemptNumber,
    query: input.query,
    strategy: input.strategy,
    topRetrievedScore: retrievedMemories[0]?.score ?? 0,
    topMemoryConfidence: retrievedMemories[0]?.memory.confidence ?? 0,
    retrievedMemories: retrievedMemories.map(createRetrievedMemorySnapshot)
  };
}

function createRetrievedMemorySnapshot(
  item: RetrievedMemory
): FeedbackRetrievedMemorySnapshot {
  return {
    memoryId: item.memory.id,
    kind: item.memory.kind,
    summary: item.memory.summary,
    score: item.score,
    confidence: item.memory.confidence,
    matchedTerms: item.matchedTerms
  };
}

function normalizeFeedbackInput(
  feedback: PersonaFeedbackInput | null
): PersonaFeedbackInput | null {
  if (feedback === null) {
    return null;
  }

  return {
    ...feedback,
    score: clampNormalizedScore(feedback.score),
    missingAspect: feedback.missingAspect?.trim() || null,
    note: feedback.note?.trim()
  };
}

function clampNormalizedScore(score: number): number {
  if (!Number.isFinite(score)) {
    throw new Error(`Feedback score must be finite. Received: ${score}`);
  }

  return Math.max(0, Math.min(score, 1));
}
