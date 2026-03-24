import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { and, eq, inArray, like, notInArray } from "drizzle-orm";

import { db, dbPath } from "./client";
import { memories, personas } from "./schema";
import {
  buildDecisionSeedMemories,
  decisionSeedOpenQuestions
} from "../seeds/persona/decision-seed";
import { confidenceFloatToStored } from "../shared/utils/confidence";
import type { CompiledMemory } from "../shared/types/memory";

const decisionSeedImportSource = "reviewed_decision_seed";
const decisionSeedMetadataPattern = `%"importSource":"${decisionSeedImportSource}"%`;

interface ImportDecisionSeedMemoriesInput {
  personaId: string;
  slug?: string;
  displayName?: string;
  description?: string | null;
}

interface ImportDecisionSeedMemoriesResult {
  personaId: string;
  importedCount: number;
  deletedCount: number;
  openQuestionCount: number;
}

/**
 * Upserts the reviewed decision seed set into SQLite and removes stale seed-backed rows.
 */
export function importDecisionSeedMemories(
  input: ImportDecisionSeedMemoriesInput
): ImportDecisionSeedMemoriesResult {
  const personaId = input.personaId;
  const now = Date.now();
  const personaRow = {
    id: personaId,
    slug: input.slug ?? personaId,
    displayName: input.displayName ?? personaId,
    description:
      input.description ?? "Persona imported from reviewed decision seed memories.",
    createdAt: new Date(now)
  };
  const memoryRows = buildDecisionSeedMemories(personaId).map((memory) =>
    serializeCompiledMemory(memory)
  );
  const importedIds = memoryRows.map((row) => row.id);

  return db.transaction((tx) => {
    tx.insert(personas)
      .values(personaRow)
      .onConflictDoUpdate({
        target: personas.id,
        set: {
          slug: personaRow.slug,
          displayName: personaRow.displayName,
          description: personaRow.description
        }
      })
      .run();

    const staleSeedRows =
      importedIds.length > 0
        ? tx
            .select({ id: memories.id })
            .from(memories)
            .where(
              and(
                eq(memories.personaId, personaId),
                like(memories.metadataJson, decisionSeedMetadataPattern),
                notInArray(memories.id, importedIds)
              )
            )
            .all()
        : [];

    if (staleSeedRows.length > 0) {
      tx.delete(memories)
        .where(
          and(
            eq(memories.personaId, personaId),
            like(memories.metadataJson, decisionSeedMetadataPattern),
            inArray(
              memories.id,
              staleSeedRows.map((row) => row.id)
            )
          )
        )
        .run();
    }

    for (const row of memoryRows) {
      const { id: _id, ...updatableRow } = row;

      tx.insert(memories)
        .values(row)
        .onConflictDoUpdate({
          target: memories.id,
          set: updatableRow
        })
        .run();
    }

    return {
      personaId,
      importedCount: memoryRows.length,
      deletedCount: staleSeedRows.length,
      openQuestionCount: decisionSeedOpenQuestions.length
    };
  });
}

/**
 * Serializes a compiled memory into the SQLite row shape used by the memories table.
 */
function serializeCompiledMemory(
  memory: CompiledMemory
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
    metadataJson: JSON.stringify({
      ...memory.metadata,
      importSource: decisionSeedImportSource
    }),
    createdAt: isoStringToDate(memory.createdAt),
    updatedAt: isoStringToDate(memory.updatedAt),
    validFrom: nullableIsoStringToDate(memory.validFrom),
    validTo: nullableIsoStringToDate(memory.validTo)
  };
}

/**
 * Parses a required ISO timestamp string into a Date for Drizzle timestamp_ms columns.
 */
function isoStringToDate(isoString: string): Date {
  const timestamp = Date.parse(isoString);

  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid ISO timestamp: ${isoString}`);
  }

  return new Date(timestamp);
}

/**
 * Parses an optional ISO timestamp string into a Date, preserving null values.
 */
function nullableIsoStringToDate(isoString: string | null): Date | null {
  if (isoString === null) {
    return null;
  }

  return isoStringToDate(isoString);
}

/**
 * Runs the importer as a small CLI entry point for local development.
 */
function runCli(): void {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      persona: {
        type: "string",
        default: "persona_demo"
      },
      slug: {
        type: "string"
      },
      name: {
        type: "string"
      },
      description: {
        type: "string"
      }
    }
  });
  const result = importDecisionSeedMemories({
    personaId: values.persona,
    slug: values.slug,
    displayName: values.name,
    description: values.description
  });

  console.log("reviewed decision seed import complete");
  console.log(`- SQLite database path: ${dbPath}`);
  console.log(`- Persona: ${result.personaId}`);
  console.log(`- Imported memories: ${result.importedCount}`);
  console.log(`- Deleted stale seed memories: ${result.deletedCount}`);
  console.log(`- Open decision questions tracked: ${result.openQuestionCount}`);
}

if (isMainModule()) {
  runCli();
}

/**
 * Detects direct execution so the module can be imported without triggering the CLI.
 */
function isMainModule(): boolean {
  const entryPath = process.argv[1];

  if (entryPath === undefined) {
    return false;
  }

  return fileURLToPath(import.meta.url) === path.resolve(entryPath);
}
