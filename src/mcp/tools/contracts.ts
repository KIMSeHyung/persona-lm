import type {
  FeedbackReason,
  FeedbackRetryReason
} from "../../runtime/feedback/index";

export const personaToolNames = [
  "search_memories",
  "get_memory_evidence",
  "get_persona_core",
  "get_session_summary",
  "submit_feedback"
] as const;

export type PersonaToolName = (typeof personaToolNames)[number];

export interface SearchMemoriesInput {
  query: string;
  kind?: string;
  topK?: number;
}

export interface SearchMemoriesResult {
  items: Array<{
    memoryId: string;
    kind: string;
    summary: string;
    score: number;
  }>;
}

export interface SubmitFeedbackInput {
  runId: string;
  score: number;
  reason: FeedbackReason;
  missingAspect?: string;
  note?: string;
}

export interface SubmitFeedbackResult {
  runId: string;
  retryTriggered: boolean;
  retryReason: FeedbackRetryReason | null;
  finalAttemptNumber: number;
}
