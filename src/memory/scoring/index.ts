import type { CompiledMemory } from "../../shared/types/memory.js";

const statusWeights: Record<CompiledMemory["status"], number> = {
  confirmed: 1,
  hypothesis: 0.6,
  conflicted: 0.25,
  stale: 0.2
};

export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[\s,./!?()[\]":;]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function scoreCompiledMemory(
  memory: CompiledMemory,
  query: string
): { score: number; matchedTerms: string[] } {
  const queryTokens = tokenize(query);
  const haystack = tokenize(
    [
      memory.summary,
      memory.canonicalText,
      memory.tags.join(" "),
      memory.scope.join(" ")
    ].join(" ")
  );

  const haystackSet = new Set(haystack);
  const matchedTerms = queryTokens.filter((token) => haystackSet.has(token));

  if (matchedTerms.length === 0) {
    return {
      score: 0,
      matchedTerms: []
    };
  }

  const lexicalScore = matchedTerms.length * 0.35;
  const confidenceScore = Math.max(0, Math.min(memory.confidence, 1));
  const statusScore = statusWeights[memory.status];

  return {
    score: confidenceScore + lexicalScore + statusScore,
    matchedTerms
  };
}
