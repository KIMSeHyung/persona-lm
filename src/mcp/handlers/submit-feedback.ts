import { persistFeedbackRun } from "../../db/feedback";
import { listMemoriesForPersona } from "../../db/memories";
import { runFeedbackPipeline } from "../../runtime/feedback/index";
import type {
  SubmitFeedbackInput,
  SubmitFeedbackResult
} from "../tools/contracts";
import type { PersonaMcpHandlerContext } from "./index";

/**
 * Runs the feedback pipeline against current long-term memory and persists the resulting run.
 */
export function handleSubmitFeedback(
  input: SubmitFeedbackInput,
  context: PersonaMcpHandlerContext
): SubmitFeedbackResult {
  const personaId = input.personaId ?? context.defaultPersonaId;
  const memories = listMemoriesForPersona({
    personaId,
    client: context.client
  });
  const run = runFeedbackPipeline({
    personaId,
    query: input.query,
    memories,
    mode: context.mode,
    sessionId: input.sessionId ?? null,
    feedback: {
      score: input.score,
      reason: input.reason,
      missingAspect: input.missingAspect,
      note: input.note
    }
  });

  persistFeedbackRun({
    run,
    client: context.client
  });

  return {
    runId: run.id,
    retryTriggered: run.retryTriggered,
    retryReason: run.retryReason,
    finalAttemptNumber: run.finalAttemptNumber,
    attemptCount: run.attempts.length
  };
}
