# 저장소 구조

## 현재 구조
```text
.
├── data/
├── drizzle/
├── spec/
├── src/
│   ├── db/
│   └── index.ts
├── AGENTS.md
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## 목표 구조
```text
src/
├── db/
│   ├── client.ts
│   ├── schema.ts
│   └── migrations/
├── ingest/
│   ├── adapters/
│   ├── normalizer/
│   └── pipeline/
├── memory/
│   ├── compiler/
│   ├── models/
│   └── scoring/
├── runtime/
│   ├── context/
│   ├── retrieval/
│   ├── prompt/
│   └── session/
├── mcp/
│   ├── server.ts
│   ├── stdio.ts
│   └── tools/
└── shared/
    ├── ids/
    ├── types/
    └── utils/
```

## 디렉터리 책임
- `db/`: 영속 저장소 스키마와 데이터 접근
- `ingest/`: raw source import 와 normalize
- `memory/`: candidate 추출과 memory compile
- `runtime/`: query 시점 orchestration
- `mcp/`: 외부 LLM이 접근하는 인터페이스
- `shared/`: 공통 타입, 유틸리티, ID 생성 등

## 가까운 시점에 추가될 파일
- `src/memory/models.ts`
- `src/runtime/retrieval.ts`
- `src/mcp/server.ts`
- `src/mcp/stdio.ts`
