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
- Vitest

## Source Of Truth
Read these files in order before making architectural changes:

1. `spec/README.md`
2. `spec/01-scope.md`
3. `spec/02-memory-model.md`
4. `spec/03-storage-and-schema.md`
5. `spec/04-ingest-and-compiler.md`
6. `spec/05-runtime-and-retrieval.md`
7. `spec/06-mcp.md`
8. `spec/07-repo-layout.md`
9. `spec/08-roadmap.md`

## Working Rules
- Keep the project local-first by default.
- Treat SQLite as the default authoritative store.
- Treat MCP as the interface layer over persona data, not the persona builder.
- Prefer compiled memory over raw evidence at runtime.
- Use raw evidence as support and traceability, not as the primary persona layer.
- Keep the implementation spec-first: update `spec/` when changing architecture, data shape, runtime flow, or MCP surface.
- Always update the relevant spec, documentation, or contract files before implementing the code change that depends on them.
- If code and spec diverge, bring the spec/contract up to date first, then apply the implementation change.
- Keep `src/db/schema.ts` aligned with `spec/03-storage-and-schema.md`.
- For every code change or new feature, add or update the relevant tests before or alongside the implementation.
- Treat missing tests as unfinished work, not as optional follow-up.
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
├── tests/
├── src/
│   ├── db/
│   ├── ingest/
│   ├── mcp/
│   ├── memory/
│   ├── runtime/
│   ├── seeds/
│   ├── shared/
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
├── seeds/
└── shared/
```

Use `spec/07-repo-layout.md` for the detailed target layout.
