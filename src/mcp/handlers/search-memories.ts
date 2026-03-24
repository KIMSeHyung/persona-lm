import { retrieveRelevantMemoriesFromStore } from "../../runtime/retrieval/index";
import type { SearchMemoriesInput, SearchMemoriesResult } from "../tools/contracts";
import type { PersonaMcpHandlerContext } from "./index";

/**
 * Runs DB-backed long-term memory retrieval for an MCP tool call.
 */
export function handleSearchMemories(
  input: SearchMemoriesInput,
  context: PersonaMcpHandlerContext
): SearchMemoriesResult {
  const retrieved = retrieveRelevantMemoriesFromStore({
    personaId: input.personaId ?? context.defaultPersonaId,
    query: input.query,
    kinds: input.kind === undefined ? undefined : [input.kind],
    limit: input.topK ?? 5,
    candidateLimit: Math.max((input.topK ?? 5) * 4, 12),
    client: context.client
  });

  return {
    items: retrieved.map((item) => ({
      memoryId: item.memory.id,
      kind: item.memory.kind,
      summary: item.memory.summary,
      score: item.score,
      confidence: item.memory.confidence,
      matchedTerms: item.matchedTerms
    }))
  };
}
