CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts
USING fts5(
  memory_id UNINDEXED,
  persona_id UNINDEXED,
  kind UNINDEXED,
  summary,
  canonical_text,
  tags,
  scope,
  tokenize = 'unicode61'
);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS memories_fts_after_insert
AFTER INSERT ON memories
BEGIN
  INSERT INTO memories_fts (
    memory_id,
    persona_id,
    kind,
    summary,
    canonical_text,
    tags,
    scope
  ) VALUES (
    new.id,
    new.persona_id,
    new.kind,
    new.summary,
    new.canonical_text,
    COALESCE(new.tags_json, ''),
    COALESCE(new.scope_json, '')
  );
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS memories_fts_after_delete
AFTER DELETE ON memories
BEGIN
  DELETE FROM memories_fts WHERE memory_id = old.id;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS memories_fts_after_update
AFTER UPDATE ON memories
BEGIN
  DELETE FROM memories_fts WHERE memory_id = old.id;
  INSERT INTO memories_fts (
    memory_id,
    persona_id,
    kind,
    summary,
    canonical_text,
    tags,
    scope
  ) VALUES (
    new.id,
    new.persona_id,
    new.kind,
    new.summary,
    new.canonical_text,
    COALESCE(new.tags_json, ''),
    COALESCE(new.scope_json, '')
  );
END;
--> statement-breakpoint
INSERT INTO memories_fts (
  memory_id,
  persona_id,
  kind,
  summary,
  canonical_text,
  tags,
  scope
)
SELECT
  m.id,
  m.persona_id,
  m.kind,
  m.summary,
  m.canonical_text,
  COALESCE(m.tags_json, ''),
  COALESCE(m.scope_json, '')
FROM memories AS m
WHERE NOT EXISTS (
  SELECT 1
  FROM memories_fts AS fts
  WHERE fts.memory_id = m.id
);
