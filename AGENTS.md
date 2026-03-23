# AGENTS.md

## Project Intent
`persona-lm` is an open-source, local-first persona runtime for building a recognizable simulation of a person from their data.

The goal is not identity reproduction.
The goal is a grounded, inspectable, "this feels like me" runtime built from compiled memory.

## Current Stack
- TypeScript
- pnpm
- SQLite
- Drizzle ORM

## Source Of Truth
Read these files in order before making architectural changes:

1. `spec/README.md`
2. `spec/01-scope.md`
3. `spec/02-memory-model.md`
4. `spec/03-storage-and-schema.md`
5. `spec/05-runtime-and-retrieval.md`
6. `spec/06-mcp.md`
7. `spec/07-repo-layout.md`
8. `spec/08-roadmap.md`

## Working Rules
- Keep the project local-first by default.
- Treat SQLite as the default authoritative store.
- Treat MCP as the interface layer over persona data, not the persona builder.
- Prefer compiled memory over raw evidence at runtime.
- Use raw evidence as support and traceability, not as the primary persona layer.
- Keep the implementation spec-first: update `spec/` when changing architecture, data shape, runtime flow, or MCP surface.
- Keep `src/db/schema.ts` aligned with `spec/03-storage-and-schema.md`.
- Avoid introducing Docker, MySQL, or remote-first assumptions unless the spec explicitly changes.

## Current Repo Map
```text
.
├── AGENTS.md
├── data/
├── drizzle/
├── drizzle.config.ts
├── package.json
├── spec/
├── src/
│   ├── db/
│   └── index.ts
└── tsconfig.json
```

## Target Direction
The intended implementation shape is:

```text
src/
├── db/
├── ingest/
├── memory/
├── runtime/
├── mcp/
└── shared/
```

Use `spec/07-repo-layout.md` for the detailed target layout.
