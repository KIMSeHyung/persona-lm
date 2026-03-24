# 저장소 구조

## 현재 구조
```text
.
├── bin/
├── data/
├── drizzle/
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
│   ├── cli.ts
│   └── index.ts
├── AGENTS.md
├── drizzle.config.ts
├── package.json
├── tsup.config.ts
├── vitest.config.ts
└── tsconfig.json
```

## 목표 구조
```text
src/
├── cli.ts
├── db/
│   ├── bootstrap.ts
│   ├── client.ts
│   ├── evidence.ts
│   ├── feedback.ts
│   ├── memories.ts
│   ├── seed.ts
│   ├── schema.ts
│   └── migrations/
├── ingest/
│   ├── adapters/
│   ├── normalizer/
│   └── pipeline/
├── jobs/
│   ├── refine/
│   ├── promote/
│   └── ingest/
├── memory/
│   ├── compiler/
│   ├── models/
│   └── scoring/
├── runtime/
│   ├── config.ts
│   ├── context/
│   ├── feedback/
│   ├── judgment/
│   ├── retrieval/
│   ├── prompt/
│   └── session/
├── mcp/
│   ├── handlers/
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
- `tests/`: 도메인별, 기능별 Vitest 테스트
- `bin/`: 빌드된 CLI를 실행 가능한 명령으로 노출하는 thin wrapper
- `db/`: 영속 저장소 스키마와 데이터 접근
- `ingest/`: raw source import 와 normalize
- `jobs/`: runtime 응답 경로와 분리된 batch / background 작업
- `memory/`: candidate 추출과 memory compile
- `runtime/`: query 시점 orchestration
- `runtime/prompt/`: prompt formatting과 재사용 가능한 host instruction asset
  - session-scoped launcher는 workspace root와 persona backend root를 분리해 다른 프로젝트에서도 `personalm`을 사용할 수 있어야 한다.
- `mcp/`: 외부 LLM이 접근하는 인터페이스
- `seeds/`: reviewed seed memory 와 fixture
- `shared/`: 공통 타입, 유틸리티, ID 생성 등

## 분리 원칙
- runtime 응답 경로와 데이터 취합/정제 경로는 장기적으로 분리한다.
- `MCP`는 persona data read/write interface로 유지하고, 무거운 batch refinement는 `jobs/` 계층으로 뺀다.
- 초기에는 같은 repo 안의 별도 CLI/worker entry로 시작하고, 필요해질 때만 long-running local service나 containerized service로 확장한다.

## 테스트 계약
- 모든 코드 변경과 신규 기능은 관련 테스트를 먼저 추가하거나 기존 테스트를 먼저 갱신해야 한다.
- 테스트는 `src/` 구조를 따라 `tests/` 아래에 배치한다.
- 구현만 바뀌고 테스트가 비어 있으면 작업이 완료된 것으로 보지 않는다.

## 현재 핵심 파일
- `src/cli.ts`
- `src/db/seed.ts`
- `src/db/feedback.ts`
- `src/db/bootstrap.ts`
- `src/db/evidence.ts`
- `src/db/memories.ts`
- `src/memory/models.ts`
- `src/runtime/config.ts`
- `src/runtime/feedback/index.ts`
- `src/runtime/judgment/index.ts`
- `src/runtime/retrieval/index.ts`
- `src/mcp/server.ts`
- `src/mcp/stdio.ts`
- `src/mcp/handlers/`
- `src/seeds/persona/decision-seed.data.ts`
- `src/seeds/persona/decision-seed.ts`

## 가까운 시점에 추가될 가능성이 큰 파일
- `src/runtime/request-classifier.ts`
- `src/mcp/handlers/search-memories.ts`
- `src/mcp/handlers/persona-core.ts`
- `src/jobs/refine/index.ts`
- `src/jobs/promote/index.ts`
