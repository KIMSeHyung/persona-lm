import { searchMemoriesForPersona } from "../../db/memories";
import type { PersonaDatabaseClient } from "../../db/client";
import { scoreCompiledMemory } from "../../memory/scoring/index";
import type {
  CompiledMemory,
  MemoryKind,
  RetrievedMemory
} from "../../shared/types/memory";

interface RetrieveRelevantMemoriesInput {
  query: string;
  memories: CompiledMemory[];
  limit?: number;
  kindWeights?: Partial<Record<MemoryKind, number>>;
}

interface RetrieveRelevantMemoriesFromStoreInput {
  personaId: string;
  query: string;
  kinds?: MemoryKind[];
  limit?: number;
  candidateLimit?: number;
  includeExpired?: boolean;
  kindWeights?: Partial<Record<MemoryKind, number>>;
  client?: PersonaDatabaseClient;
}

export function retrieveRelevantMemories(
  input: RetrieveRelevantMemoriesInput
): RetrievedMemory[] {
  return input.memories
    .map((memory) => {
      const { score: baseScore, matchedTerms } = scoreCompiledMemory(memory, input.query);
      const kindWeight = input.kindWeights?.[memory.kind] ?? 0;

      return {
        memory,
        score: baseScore === 0 ? 0 : baseScore + kindWeight,
        matchedTerms
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit ?? 5);
}

/**
 * Retrieves DB-backed long-term memory candidates via SQLite FTS and reranks them in runtime.
 */
export function retrieveRelevantMemoriesFromStore(
  input: RetrieveRelevantMemoriesFromStoreInput
): RetrievedMemory[] {
  const candidateMemories = searchMemoriesForPersona({
    personaId: input.personaId,
    query: input.query,
    kinds: input.kinds,
    candidateLimit:
      input.candidateLimit ?? Math.max((input.limit ?? 5) * 4, 12),
    includeExpired: input.includeExpired,
    client: input.client
  });

  return retrieveRelevantMemories({
    query: input.query,
    memories: candidateMemories,
    limit: input.limit,
    kindWeights: input.kindWeights
  });
}
