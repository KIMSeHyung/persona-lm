export const personaToolNames = [
  "search_memories",
  "get_memory_evidence",
  "get_persona_core",
  "get_session_summary"
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
