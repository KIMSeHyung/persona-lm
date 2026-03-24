import { and, eq } from "drizzle-orm";

import { db, type PersonaDatabaseClient } from "./client";
import { memories, personas } from "./schema";
import { createCompiledMemory } from "../memory/models";
import { confidenceFloatToStored } from "../shared/utils/confidence";
import type { MemoryKind } from "../shared/types/memory";

const sessionMemoryImportSource = "session_memory_save";
const autoPromoteKinds = new Set<MemoryKind>(["decision_rule", "preference", "value"]);

export interface SessionMemoryCandidateInput {
  kind: MemoryKind;
  summary: string;
  canonicalText: string;
  confidence: number;
  scope?: string[];
  tags?: string[];
  note?: string;
  supportingEvidence?: string[];
}

export interface SaveSessionMemoriesInput {
  personaId: string;
  sessionId?: string;
  candidates: SessionMemoryCandidateInput[];
  client?: PersonaDatabaseClient;
}

export interface SaveSessionMemoriesResult extends Record<string, unknown> {
  personaId: string;
  sessionId: string | null;
  savedCount: number;
  updatedCount: number;
  items: Array<{
    memoryId: string;
    kind: MemoryKind;
    summary: string;
    status: string;
    stability: string;
    confidence: number;
  }>;
}

/**
 * Saves session-derived durable memory candidates directly into the long-term memory store.
 */
export function saveSessionMemories(
  input: SaveSessionMemoriesInput
): SaveSessionMemoriesResult {
  const database = input.client?.db ?? db;
  const personaId = input.personaId;
  const sessionId = input.sessionId ?? null;

  return database.transaction((tx) => {
    const now = new Date();

    tx.insert(personas)
      .values({
        id: personaId,
        slug: personaId,
        displayName: personaId,
        description: "Persona created from session-derived memory saves.",
        createdAt: now
      })
      .onConflictDoNothing()
      .run();

    const items: SaveSessionMemoriesResult["items"] = [];
    let savedCount = 0;
    let updatedCount = 0;

    for (const candidate of input.candidates) {
      const existing = tx
        .select()
        .from(memories)
        .where(
          and(
            eq(memories.personaId, personaId),
            eq(memories.kind, candidate.kind),
            eq(memories.summary, candidate.summary)
          )
        )
        .limit(1)
        .get();

      if (existing === undefined) {
        const memory = createCompiledMemory({
          personaId,
          kind: candidate.kind,
          summary: candidate.summary,
          canonicalText: candidate.canonicalText,
          status: "hypothesis",
          confidence: candidate.confidence,
          stability: "emerging",
          scope: candidate.scope ?? [],
          tags: candidate.tags ?? [],
          sourceTypes: ["llm_chat"],
          evidenceIds: [],
          metadata: {
            importSource: sessionMemoryImportSource,
            sessionId,
            note: candidate.note ?? null,
            supportingEvidence: candidate.supportingEvidence ?? [],
            sessionSaveCount: 1
          },
          validFrom: new Date().toISOString(),
          validTo: null
        });
        const row = serializeCompiledMemory(memory);

        tx.insert(memories).values(row).run();

        items.push({
          memoryId: row.id,
          kind: candidate.kind,
          summary: candidate.summary,
          status: row.status,
          stability: row.stability,
          confidence: candidate.confidence
        });
        savedCount += 1;
        continue;
      }

      const existingMetadata = parseMetadataJson(existing.metadataJson);
      const updatedMetadata = {
        ...existingMetadata,
        importSource: sessionMemoryImportSource,
        sessionId,
        note: candidate.note ?? existingMetadata.note ?? null,
        supportingEvidence: uniqueStrings([
          ...readStringArray(existingMetadata.supportingEvidence),
          ...(candidate.supportingEvidence ?? [])
        ]),
        sessionSaveCount: readPositiveNumber(existingMetadata.sessionSaveCount) + 1
      };
      const updatedScope = uniqueStrings([
        ...parseStringArrayJson(existing.scopeJson),
        ...(candidate.scope ?? [])
      ]);
      const updatedTags = uniqueStrings([
        ...parseStringArrayJson(existing.tagsJson),
        ...(candidate.tags ?? [])
      ]);
      const updatedSourceTypes = uniqueStrings([
        ...parseStringArrayJson(existing.sourceTypesJson),
        "llm_chat"
      ]);
      const nextConfidence = Math.max(
        existing.confidence,
        confidenceFloatToStored(candidate.confidence)
      );
      const nextCanonicalText =
        candidate.canonicalText.length > existing.canonicalText.length
          ? candidate.canonicalText
          : existing.canonicalText;
      const promotion = resolveSessionMemoryPromotion({
        kind: candidate.kind,
        existingStatus: existing.status,
        existingStability: existing.stability,
        existingMetadata,
        nextMetadata: updatedMetadata
      });

      tx.update(memories)
        .set({
          canonicalText: nextCanonicalText,
          status: promotion.status,
          confidence: nextConfidence,
          stability: promotion.stability,
          scopeJson: JSON.stringify(updatedScope),
          tagsJson: JSON.stringify(updatedTags),
          sourceTypesJson: JSON.stringify(updatedSourceTypes),
          metadataJson: JSON.stringify(updatedMetadata),
          updatedAt: new Date()
        })
        .where(eq(memories.id, existing.id))
        .run();

      items.push({
        memoryId: existing.id,
        kind: candidate.kind,
        summary: candidate.summary,
        status: promotion.status,
        stability: promotion.stability,
        confidence: nextConfidence / 1000
      });
      updatedCount += 1;
    }

    return {
      personaId,
      sessionId,
      savedCount,
      updatedCount,
      items
    };
  });
}

function serializeCompiledMemory(
  memory: ReturnType<typeof createCompiledMemory>
): typeof memories.$inferInsert {
  return {
    id: memory.id,
    personaId: memory.personaId,
    kind: memory.kind,
    summary: memory.summary,
    canonicalText: memory.canonicalText,
    status: memory.status,
    confidence: confidenceFloatToStored(memory.confidence),
    stability: memory.stability,
    scopeJson: JSON.stringify(memory.scope),
    tagsJson: JSON.stringify(memory.tags),
    sourceTypesJson: JSON.stringify(memory.sourceTypes),
    evidenceIdsJson: JSON.stringify(memory.evidenceIds),
    metadataJson: JSON.stringify(memory.metadata),
    createdAt: isoStringToDate(memory.createdAt),
    updatedAt: isoStringToDate(memory.updatedAt),
    validFrom: nullableIsoStringToDate(memory.validFrom),
    validTo: nullableIsoStringToDate(memory.validTo)
  };
}

function isoStringToDate(isoString: string): Date {
  const timestamp = Date.parse(isoString);

  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid ISO timestamp: ${isoString}`);
  }

  return new Date(timestamp);
}

function nullableIsoStringToDate(isoString: string | null): Date | null {
  if (isoString === null) {
    return null;
  }

  return isoStringToDate(isoString);
}

function parseStringArrayJson(value: string | null): string[] {
  if (value === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseMetadataJson(value: string | null): Record<string, unknown> {
  if (value === null) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function readPositiveNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function resolveSessionMemoryPromotion(input: {
  kind: MemoryKind;
  existingStatus: string;
  existingStability: string;
  existingMetadata: Record<string, unknown>;
  nextMetadata: Record<string, unknown>;
}): { status: string; stability: string } {
  const existingSessionId =
    typeof input.existingMetadata.sessionId === "string"
      ? input.existingMetadata.sessionId
      : null;
  const nextSessionId =
    typeof input.nextMetadata.sessionId === "string"
      ? input.nextMetadata.sessionId
      : null;
  const sessionSaveCount = readPositiveNumber(input.nextMetadata.sessionSaveCount);
  const repeatedAcrossSessions =
    existingSessionId !== null &&
    nextSessionId !== null &&
    existingSessionId !== nextSessionId;
  const canAutoPromote = autoPromoteKinds.has(input.kind);

  if (
    canAutoPromote &&
    repeatedAcrossSessions &&
    sessionSaveCount >= 2
  ) {
    return {
      status: "confirmed",
      stability: "stable"
    };
  }

  return {
    status: input.existingStatus,
    stability: input.existingStability
  };
}
