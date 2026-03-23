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
  personaId: text("persona_id")
    .notNull()
    .references(() => personas.id),
  sourceType: text("source_type").notNull(),
  authoredBySelf: integer("authored_by_self", { mode: "boolean" }).notNull(),
  content: text("content").notNull(),
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
  canonicalText: text("canonical_text").notNull(),
  status: text("status").notNull(),
  confidence: integer("confidence").notNull(),
  scopeJson: text("scope_json"),
  tagsJson: text("tags_json"),
  metadataJson: text("metadata_json"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull()
});
