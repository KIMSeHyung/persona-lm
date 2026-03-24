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
