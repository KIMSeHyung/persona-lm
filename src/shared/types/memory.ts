export const sourceTypes = ["notes", "llm_chat", "sns", "messenger", "email"] as const;
export type SourceType = (typeof sourceTypes)[number];

export const memoryKinds = [
  "style_rule",
  "preference",
  "interest",
  "decision_rule",
  "self_description",
  "value",
  "episodic_memory"
] as const;
export type MemoryKind = (typeof memoryKinds)[number];

export const memoryStatuses = [
  "confirmed",
  "hypothesis",
  "conflicted",
  "stale"
] as const;
export type MemoryStatus = (typeof memoryStatuses)[number];

export const memoryStabilities = ["volatile", "emerging", "stable"] as const;
export type MemoryStability = (typeof memoryStabilities)[number];

export interface NormalizedEvidenceUnit {
  id: string;
  artifactId: string;
  personaId: string;
  sourceType: SourceType;
  channel: string;
  authoredBySelf: boolean;
  authorLabel: string;
  text: string;
  roomId: string | null;
  tags: string[];
  createdAt: string | null;
  metadata: Record<string, unknown>;
}

export interface MemoryCandidate {
  id: string;
  personaId: string;
  kind: MemoryKind;
  summary: string;
  canonicalText: string;
  status: MemoryStatus;
  confidence: number;
  stability: MemoryStability;
  scope: string[];
  tags: string[];
  sourceTypes: SourceType[];
  evidenceIds: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CompiledMemory extends MemoryCandidate {
  validFrom: string | null;
  validTo: string | null;
}

export interface RetrievedMemory {
  memory: CompiledMemory;
  score: number;
  matchedTerms: string[];
}
