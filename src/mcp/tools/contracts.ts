import type {
  FeedbackReason,
  FeedbackRetryReason
} from "../../runtime/feedback/index";
import type { PersonaCore } from "../../runtime/context/persona-core";
import type { MemoryKind } from "../../shared/types/memory";

export const personaToolNames = [
  "search_memories",
  "get_memory_evidence",
  "get_persona_core",
  "get_session_summary",
  "submit_feedback"
] as const;

export type PersonaToolName = (typeof personaToolNames)[number];

export interface SearchMemoriesInput {
  personaId?: string;
  query: string;
  kind?: MemoryKind;
  topK?: number;
}

export interface SearchMemoriesResult extends Record<string, unknown> {
  items: Array<{
    memoryId: string;
    kind: string;
    summary: string;
    score: number;
    confidence: number;
    matchedTerms: string[];
  }>;
}

export interface GetPersonaCoreInput {
  personaId?: string;
}

export interface GetPersonaCoreResult extends PersonaCore, Record<string, unknown> {
  personaId: string;
}

export interface GetMemoryEvidenceInput {
  memoryId: string;
}

export interface GetMemoryEvidenceResult extends Record<string, unknown> {
  memoryId: string;
  evidence: Array<{
    id: string;
    sourceType: string;
    channel: string;
    authorLabel: string;
    content: string;
    createdAt: string | null;
  }>;
}

export interface GetSessionSummaryInput {
  personaId?: string;
  sessionId?: string;
}

export interface GetSessionSummaryResult extends Record<string, unknown> {
  personaId: string;
  sessionId: string | null;
  summary: {
    currentGoal: string | null;
    activeTopics: string[];
    recentCommitments: string[];
    updatedAt: string | null;
  } | null;
  available: boolean;
}

export interface SubmitFeedbackInput {
  personaId?: string;
  query: string;
  score: number;
  reason: FeedbackReason;
  missingAspect?: string;
  note?: string;
  sessionId?: string;
}

export interface SubmitFeedbackResult extends Record<string, unknown> {
  runId: string;
  retryTriggered: boolean;
  retryReason: FeedbackRetryReason | null;
  finalAttemptNumber: number;
  attemptCount: number;
}
