import { scoreCompiledMemory } from "../../memory/scoring/index";
import type { CompiledMemory, RetrievedMemory } from "../../shared/types/memory";

interface RetrieveRelevantMemoriesInput {
  query: string;
  memories: CompiledMemory[];
  limit?: number;
}

export function retrieveRelevantMemories(
  input: RetrieveRelevantMemoriesInput
): RetrievedMemory[] {
  return input.memories
    .map((memory) => {
      const { score, matchedTerms } = scoreCompiledMemory(memory, input.query);

      return {
        memory,
        score,
        matchedTerms
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit ?? 5);
}
