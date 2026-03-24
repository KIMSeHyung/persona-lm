import { buildDecisionContextFromStore } from "../../runtime/context/decision-context";
import type {
  GetDecisionContextInput,
  GetDecisionContextResult
} from "../tools/contracts";
import type { PersonaMcpHandlerContext } from "./index";

/**
 * Returns a grouped decision context bundle so hosts can answer decision questions with one tool call.
 */
export function handleGetDecisionContext(
  input: GetDecisionContextInput,
  context: PersonaMcpHandlerContext
): GetDecisionContextResult {
  return buildDecisionContextFromStore({
    personaId: input.personaId ?? context.defaultPersonaId,
    query: input.query,
    client: context.client
  });
}
