import type {
  GetSessionSummaryInput,
  GetSessionSummaryResult
} from "../tools/contracts";
import type { PersonaMcpHandlerContext } from "./index";

/**
 * Returns the current session summary surface.
 * Session state is not implemented yet, so the server reports an unavailable summary.
 */
export function handleGetSessionSummary(
  input: GetSessionSummaryInput,
  context: PersonaMcpHandlerContext
): GetSessionSummaryResult {
  return {
    personaId: input.personaId ?? context.defaultPersonaId,
    sessionId: input.sessionId ?? null,
    summary: null,
    available: false
  };
}
