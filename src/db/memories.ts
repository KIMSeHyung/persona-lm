import {
  and,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  or
} from "drizzle-orm";

import { db, sqlite, type PersonaDatabaseClient } from "./client";
import { memories } from "./schema";
import { confidenceStoredToFloat } from "../shared/utils/confidence";
import type {
  CompiledMemory,
  MemoryKind,
  MemoryStability,
  MemoryStatus,
  SourceType
} from "../shared/types/memory";

interface ListMemoriesForPersonaInput {
  personaId: string;
  kinds?: MemoryKind[];
  limit?: number;
  includeExpired?: boolean;
  client?: PersonaDatabaseClient;
}

interface GetMemoryByIdInput {
  id: string;
  client?: PersonaDatabaseClient;
}

interface SearchMemoriesForPersonaInput {
  personaId: string;
  query: string;
  kinds?: MemoryKind[];
  candidateLimit?: number;
  includeExpired?: boolean;
  client?: PersonaDatabaseClient;
}

const memorySearchIndexTable = "memories_fts";

/**
 * Loads current long-term memories for a persona from SQLite and hydrates them into compiled memory objects.
 */
export function listMemoriesForPersona(
  input: ListMemoriesForPersonaInput
): CompiledMemory[] {
  const database = input.client?.db ?? db;
  const now = new Date();
  const filters = [eq(memories.personaId, input.personaId)];

  if (input.kinds !== undefined && input.kinds.length > 0) {
    filters.push(inArray(memories.kind, input.kinds));
  }

  if (input.includeExpired !== true) {
    filters.push(or(isNull(memories.validTo), gt(memories.validTo, now))!);
  }

  const rows = database
    .select()
    .from(memories)
    .where(and(...filters))
    .orderBy(desc(memories.confidence), desc(memories.updatedAt))
    .limit(input.limit ?? 500)
    .all();

  return rows.map(hydrateCompiledMemory);
}

/**
 * Loads a single compiled memory from SQLite by id.
 */
export function getMemoryById(input: GetMemoryByIdInput): CompiledMemory | null {
  const database = input.client?.db ?? db;
  const row = database
    .select()
    .from(memories)
    .where(eq(memories.id, input.id))
    .limit(1)
    .get();

  if (row === undefined) {
    return null;
  }

  return hydrateCompiledMemory(row);
}

/**
 * Uses SQLite FTS5 to fetch top-N long-term memory candidates before runtime reranking.
 */
export function searchMemoriesForPersona(
  input: SearchMemoriesForPersonaInput
): CompiledMemory[] {
  const sqliteDatabase = input.client?.sqlite ?? sqlite;
  ensureMemorySearchIndexAvailable(sqliteDatabase);

  const matchExpression = buildFtsMatchExpression(input.query);

  if (matchExpression === null) {
    return listMemoriesForPersona({
      personaId: input.personaId,
      kinds: input.kinds,
      limit: input.candidateLimit ?? 20,
      includeExpired: input.includeExpired,
      client: input.client
    });
  }

  const kindFilter =
    input.kinds !== undefined && input.kinds.length > 0
      ? ` AND m.kind IN (${input.kinds.map(() => "?").join(", ")})`
      : "";
  const expiryFilter =
    input.includeExpired === true
      ? ""
      : " AND (m.valid_to IS NULL OR m.valid_to > ?)";
  const statement = sqliteDatabase.prepare(`
    SELECT ${memorySearchIndexTable}.memory_id AS memoryId
    FROM ${memorySearchIndexTable}
    JOIN memories AS m ON m.id = ${memorySearchIndexTable}.memory_id
    WHERE ${memorySearchIndexTable}.persona_id = ?
      AND ${memorySearchIndexTable} MATCH ?
      ${expiryFilter}
      ${kindFilter}
    ORDER BY bm25(${memorySearchIndexTable}), m.confidence DESC, m.updated_at DESC
    LIMIT ?
  `);
  const params: Array<string | number> = [input.personaId, matchExpression];

  if (input.includeExpired !== true) {
    params.push(Date.now());
  }

  if (input.kinds !== undefined && input.kinds.length > 0) {
    params.push(...input.kinds);
  }

  params.push(input.candidateLimit ?? 20);

  const rows = statement.all(...params) as Array<{ memoryId: string }>;

  return listMemoriesByIds({
    ids: rows.map((row) => row.memoryId),
    client: input.client
  });
}

/**
 * Verifies that the FTS support structure exists before running candidate retrieval.
 */
function ensureMemorySearchIndexAvailable(
  sqliteDatabase: PersonaDatabaseClient["sqlite"]
): void {
  const row = sqliteDatabase
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = ?
      `
    )
    .get(memorySearchIndexTable) as { name: string } | undefined;

  if (row === undefined) {
    throw new Error(
      "Missing memories_fts support structure. Run `pnpm db:push` or `pnpm db:bootstrap` first."
    );
  }
}

/**
 * Loads a specific set of memory ids while preserving the incoming id order.
 */
function listMemoriesByIds(input: {
  ids: string[];
  client?: PersonaDatabaseClient;
}): CompiledMemory[] {
  if (input.ids.length === 0) {
    return [];
  }

  const database = input.client?.db ?? db;
  const rows = database
    .select()
    .from(memories)
    .where(inArray(memories.id, input.ids))
    .all();
  const order = new Map(input.ids.map((id, index) => [id, index]));

  return rows
    .sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER))
    .map(hydrateCompiledMemory);
}

function hydrateCompiledMemory(
  row: typeof memories.$inferSelect
): CompiledMemory {
  return {
    id: row.id,
    personaId: row.personaId,
    kind: row.kind as MemoryKind,
    summary: row.summary,
    canonicalText: row.canonicalText,
    status: row.status as MemoryStatus,
    confidence: confidenceStoredToFloat(row.confidence),
    stability: row.stability as MemoryStability,
    scope: parseStringArrayJson(row.scopeJson),
    tags: parseStringArrayJson(row.tagsJson),
    sourceTypes: parseStringArrayJson(row.sourceTypesJson) as SourceType[],
    evidenceIds: parseStringArrayJson(row.evidenceIdsJson),
    metadata: parseMetadataJson(row.metadataJson),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    validFrom: row.validFrom?.toISOString() ?? null,
    validTo: row.validTo?.toISOString() ?? null
  };
}

function parseStringArrayJson(value: string | null): string[] {
  if (value === null) {
    return [];
  }

  const parsed = JSON.parse(value) as unknown;

  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function parseMetadataJson(value: string | null): Record<string, unknown> {
  if (value === null) {
    return {};
  }

  const parsed = JSON.parse(value) as unknown;
  return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

/**
 * Converts a natural-language query into a broad FTS OR expression for candidate retrieval.
 */
function buildFtsMatchExpression(query: string): string | null {
  const tokens = [...new Set(tokenizeQuery(query))];

  if (tokens.length === 0) {
    return null;
  }

  return tokens.map((token) => `"${token.replaceAll("\"", "\"\"")}"`).join(" OR ");
}

/**
 * Splits a query into stable tokens for SQLite FTS matching.
 */
function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,./!?()[\]":;]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}
