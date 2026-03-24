# db

이 디렉터리는 `persona-lm`의 영속 저장소 계층이다.

## 현재 파일
- `bootstrap.ts`
  - `drizzle/support/*.sql`에 있는 SQLite support migration을 적용한다.
- `client.ts`
  - SQLite 파일 경로를 잡고 Drizzle client를 생성한다.
- `evidence.ts`
  - evidence row를 조회하는 read repository다.
- `feedback.ts`
  - feedback pipeline run을 SQLite `feedback_runs` 테이블에 기록하고 조회한다.
- `memories.ts`
  - SQLite `memories` row를 runtime이 쓰는 `CompiledMemory`로 hydrate 하는 read repository다.
  - long-term memory candidate search를 담당한다.
- `session-memories.ts`
  - 같은 세션의 LLM이 추출한 durable memory candidate를 `memories`에 직접 저장하거나 기존 row를 보강 update한다.
- `seed.ts`
  - reviewed seed memory를 SQLite `memories` row로 upsert 하는 개발용 importer다.
- `schema.ts`
  - 현재 bootstrap 단계의 테이블 정의를 담는다.

## 현재 역할
- authoritative store는 SQLite로 둔다.
- 앱 내부의 공식 데이터 구조는 이 계층을 기준으로 유지한다.
- `memories.confidence`는 저장 시 `0 ~ 1000` 정수 스케일을 사용한다.
- `feedback_runs.feedback_score`도 저장 시 `0 ~ 1000` 정수 스케일을 사용한다.
- `metadata_json`은 kind별 상세 구조를 담고, 검색/정렬용 핵심 필드는 개별 컬럼으로 유지한다.
- 현재 개발 단계의 스키마 반영은 `pnpm db:push`를 기본으로 한다.
- `pnpm db:push`는 `drizzle-kit push` 뒤에 `db:bootstrap`을 실행해 support migration까지 적용한다.
- reviewed seed 적재는 `pnpm db:seed`를 기본 진입점으로 한다.
- runtime long-term memory read는 `memories.ts`를 통해 SQLite `memories`에서 시작한다.
- query retrieval의 첫 단계는 `memories.ts`가 관리하는 SQLite `FTS5` top-N candidate search다.
- `FTS`는 후보 검색 전용이고, 최종 선택은 runtime rerank가 담당한다.
- feedback pipeline log는 `feedback_runs`에 저장해 offline scorer tuning에 재사용한다.
- 개발 실행은 `node --import tsx`를 사용하고, 프로덕션 빌드는 root의 `tsup.config.ts`를 따른다.

## 이후 추가될 것
- `memory_evidence` 같은 join table
- `sessions`, `session_state`
- read repository 레이어

## 주의점
- 이 디렉터리의 스키마는 `spec/03-storage-and-schema.md`와 항상 맞춰야 한다.
- SQLite 전용 support DDL은 repository 안에 흩뿌리지 말고 `drizzle/support/*.sql`에 모은다.
- runtime이 쓰는 메모리 구조와 DB 구조가 어긋나면 이후 ingest와 MCP가 같이 흔들린다.
