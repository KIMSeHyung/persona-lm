import { inArray } from "drizzle-orm";

import { db, type PersonaDatabaseClient } from "./client";
import { evidence } from "./schema";

export interface PersistedEvidence {
  id: string;
  sourceType: string;
  channel: string;
  authorLabel: string;
  content: string;
  createdAt: string | null;
}

interface ListEvidenceByIdsInput {
  ids: string[];
  client?: PersonaDatabaseClient;
}

/**
 * Loads evidence rows by id while preserving the requested id order.
 */
export function listEvidenceByIds(
  input: ListEvidenceByIdsInput
): PersistedEvidence[] {
  if (input.ids.length === 0) {
    return [];
  }

  const database = input.client?.db ?? db;
  const rows = database
    .select()
    .from(evidence)
    .where(inArray(evidence.id, input.ids))
    .all();
  const order = new Map(input.ids.map((id, index) => [id, index]));

  return rows
    .sort(
      (a, b) =>
        (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    )
    .map((row) => ({
      id: row.id,
      sourceType: row.sourceType,
      channel: row.channel,
      authorLabel: row.authorLabel,
      content: row.content,
      createdAt: row.createdAt?.toISOString() ?? null
    }));
}
