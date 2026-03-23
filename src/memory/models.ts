import { createId } from "../shared/ids.js";
import type {
  CompiledMemory,
  MemoryCandidate,
  MemoryKind,
  MemoryStability,
  MemoryStatus,
  SourceType
} from "../shared/types/memory.js";

interface CreateMemoryCandidateInput {
  personaId: string;
  kind: MemoryKind;
  summary: string;
  canonicalText: string;
  confidence: number;
  sourceTypes: SourceType[];
  evidenceIds: string[];
  status?: MemoryStatus;
  stability?: MemoryStability;
  scope?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface PromoteCandidateInput {
  candidate: MemoryCandidate;
  validFrom?: string | null;
  validTo?: string | null;
}

interface CreateCompiledMemoryInput {
  id?: string;
  personaId: string;
  kind: MemoryKind;
  summary: string;
  canonicalText: string;
  status: MemoryStatus;
  confidence: number;
  stability?: MemoryStability;
  scope?: string[];
  tags?: string[];
  sourceTypes?: SourceType[];
  evidenceIds?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  validFrom?: string | null;
  validTo?: string | null;
}

export function createMemoryCandidate(
  input: CreateMemoryCandidateInput
): MemoryCandidate {
  const now = new Date().toISOString();

  return {
    id: createId("cand"),
    personaId: input.personaId,
    kind: input.kind,
    summary: input.summary,
    canonicalText: input.canonicalText,
    status: input.status ?? "hypothesis",
    confidence: input.confidence,
    stability: input.stability ?? "emerging",
    scope: input.scope ?? [],
    tags: input.tags ?? [],
    sourceTypes: input.sourceTypes,
    evidenceIds: input.evidenceIds,
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now
  };
}

export function promoteCandidateToMemory(
  input: PromoteCandidateInput
): CompiledMemory {
  return createCompiledMemory({
    ...input.candidate,
    validFrom: input.validFrom ?? null,
    validTo: input.validTo ?? null
  });
}

export function createCompiledMemory(
  input: CreateCompiledMemoryInput
): CompiledMemory {
  const now = input.createdAt ?? new Date().toISOString();

  return {
    id: input.id ?? createId("mem"),
    personaId: input.personaId,
    kind: input.kind,
    summary: input.summary,
    canonicalText: input.canonicalText,
    status: input.status,
    confidence: input.confidence,
    stability: input.stability ?? "emerging",
    scope: input.scope ?? [],
    tags: input.tags ?? [],
    sourceTypes: input.sourceTypes ?? [],
    evidenceIds: input.evidenceIds ?? [],
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: input.updatedAt ?? now,
    validFrom: input.validFrom ?? null,
    validTo: input.validTo ?? null
  };
}
