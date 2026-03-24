import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const personas = sqliteTable("personas", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
});

export const evidence = sqliteTable("evidence", {
  id: text("id").primaryKey(),
  // Links an evidence unit back to the imported raw artifact.
  artifactId: text("artifact_id").notNull(),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id),
  sourceType: text("source_type").notNull(),
  // Keeps the sub-channel inside a source, such as a room or mailbox.
  channel: text("channel").notNull(),
  authoredBySelf: integer("authored_by_self", { mode: "boolean" }).notNull(),
  // Human-readable speaker label retained from normalization.
  authorLabel: text("author_label").notNull(),
  content: text("content").notNull(),
  roomId: text("room_id"),
  tagsJson: text("tags_json"),
  metadataJson: text("metadata_json"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
});

export const memories = sqliteTable("memories", {
  id: text("id").primaryKey(),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id),
  kind: text("kind").notNull(),
  summary: text("summary").notNull(),
  // Retrieval-friendly normalized text that can back FTS later.
  canonicalText: text("canonical_text").notNull(),
  status: text("status").notNull(),
  // Stored as an integer score from 0 to 1000.
  confidence: integer("confidence").notNull(),
  stability: text("stability").notNull(),
  scopeJson: text("scope_json"),
  tagsJson: text("tags_json"),
  sourceTypesJson: text("source_types_json"),
  evidenceIdsJson: text("evidence_ids_json"),
  metadataJson: text("metadata_json"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  validFrom: integer("valid_from", { mode: "timestamp_ms" }),
  validTo: integer("valid_to", { mode: "timestamp_ms" })
});

export const feedbackRuns = sqliteTable("feedback_runs", {
  id: text("id").primaryKey(),
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id),
  sessionId: text("session_id"),
  mode: text("mode").notNull(),
  query: text("query").notNull(),
  decisionQuery: integer("decision_query", { mode: "boolean" }).notNull(),
  feedbackScore: integer("feedback_score"),
  feedbackReason: text("feedback_reason"),
  missingAspect: text("missing_aspect"),
  retryTriggered: integer("retry_triggered", { mode: "boolean" }).notNull(),
  retryReason: text("retry_reason"),
  attemptCount: integer("attempt_count").notNull(),
  finalAttemptNumber: integer("final_attempt_number").notNull(),
  metadataJson: text("metadata_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
});
