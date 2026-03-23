# 저장소 구조

## 현재 구조
```text
.
├── data/
├── drizzle/
├── spec/
├── src/
│   ├── db/
│   ├── ingest/
│   ├── mcp/
│   ├── memory/
│   ├── runtime/
│   ├── seeds/
│   ├── shared/
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
├── seeds/
│   ├── README.md
│   └── persona/
│       ├── README.md
│       ├── decision-seed.data.ts
│       └── decision-seed.ts
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
- `seeds/`: reviewed seed memory 와 fixture
- `shared/`: 공통 타입, 유틸리티, ID 생성 등

## 현재 핵심 파일
- `src/memory/models.ts`
- `src/runtime/retrieval/index.ts`
- `src/mcp/server.ts`
- `src/mcp/stdio.ts`
- `src/seeds/persona/decision-seed.data.ts`
- `src/seeds/persona/decision-seed.ts`

## 가까운 시점에 추가될 가능성이 큰 파일
- `src/db/seed.ts`
- `src/runtime/request-classifier.ts`
- `src/mcp/handlers/search-memories.ts`
