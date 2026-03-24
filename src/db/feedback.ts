import { desc, eq } from "drizzle-orm";

import { db, type PersonaDatabaseClient } from "./client";
import { feedbackRuns } from "./schema";
import type {
  FeedbackPipelineAttempt,
  FeedbackPipelineRun
} from "../runtime/feedback/index";

interface PersistFeedbackRunInput {
  run: FeedbackPipelineRun;
  client?: PersonaDatabaseClient;
}

interface ListFeedbackRunsForPersonaInput {
  personaId: string;
  limit?: number;
  client?: PersonaDatabaseClient;
}

interface FeedbackRunMetadata {
  attempts: FeedbackPipelineAttempt[];
  note: string | null;
}

/**
 * Persists a single feedback pipeline run into SQLite for later inspection and tuning.
 */
export function persistFeedbackRun(input: PersistFeedbackRunInput): void {
  const database = input.client?.db ?? db;

  database
    .insert(feedbackRuns)
    .values(serializeFeedbackRun(input.run))
    .run();
}

/**
 * Lists recent feedback runs for a persona and hydrates attempt metadata back into objects.
 */
export function listFeedbackRunsForPersona(
  input: ListFeedbackRunsForPersonaInput
): FeedbackPipelineRun[] {
  const database = input.client?.db ?? db;
  const rows = database
    .select()
    .from(feedbackRuns)
    .where(eq(feedbackRuns.personaId, input.personaId))
    .orderBy(desc(feedbackRuns.createdAt))
    .limit(input.limit ?? 20)
    .all();

  return rows.map(deserializeFeedbackRun);
}

function serializeFeedbackRun(
  run: FeedbackPipelineRun
): typeof feedbackRuns.$inferInsert {
  return {
    id: run.id,
    personaId: run.personaId,
    sessionId: run.sessionId,
    mode: run.mode,
    query: run.query,
    decisionQuery: run.decisionQuery,
    feedbackScore: run.feedback === null ? null : feedbackScoreToStored(run.feedback.score),
    feedbackReason: run.feedback?.reason ?? null,
    missingAspect: run.feedback?.missingAspect ?? null,
    retryTriggered: run.retryTriggered,
    retryReason: run.retryReason,
    attemptCount: run.attempts.length,
    finalAttemptNumber: run.finalAttemptNumber,
    metadataJson: JSON.stringify({
      attempts: run.attempts,
      note: run.feedback?.note ?? null
    } satisfies FeedbackRunMetadata),
    createdAt: isoStringToDate(run.createdAt)
  };
}

function deserializeFeedbackRun(
  row: typeof feedbackRuns.$inferSelect
): FeedbackPipelineRun {
  const metadata = JSON.parse(row.metadataJson) as FeedbackRunMetadata;

  return {
    id: row.id,
    personaId: row.personaId,
    sessionId: row.sessionId,
    mode: row.mode as FeedbackPipelineRun["mode"],
    query: row.query,
    decisionQuery: row.decisionQuery,
    feedback:
      row.feedbackScore === null || row.feedbackReason === null
        ? null
        : {
            score: storedFeedbackScoreToFloat(row.feedbackScore),
            reason: row.feedbackReason as NonNullable<FeedbackPipelineRun["feedback"]>["reason"],
            missingAspect: row.missingAspect,
            note: metadata.note ?? undefined
          },
    retryTriggered: row.retryTriggered,
    retryReason: row.retryReason as FeedbackPipelineRun["retryReason"],
    attempts: metadata.attempts,
    finalAttemptNumber: row.finalAttemptNumber,
    createdAt: row.createdAt.toISOString()
  };
}

function feedbackScoreToStored(score: number): number {
  return Math.round(Math.max(0, Math.min(score, 1)) * 1000);
}

function storedFeedbackScoreToFloat(score: number): number {
  return Math.max(0, Math.min(score, 1000)) / 1000;
}

function isoStringToDate(isoString: string): Date {
  const timestamp = Date.parse(isoString);

  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid ISO timestamp: ${isoString}`);
  }

  return new Date(timestamp);
}
