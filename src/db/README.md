# db

이 디렉터리는 `persona-lm`의 영속 저장소 계층이다.

## 현재 파일
- `client.ts`
  - SQLite 파일 경로를 잡고 Drizzle client를 생성한다.
- `feedback.ts`
  - feedback pipeline run을 SQLite `feedback_runs` 테이블에 기록하고 조회한다.
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
- reviewed seed 적재는 `pnpm db:seed`를 기본 진입점으로 한다.
- feedback pipeline log는 `feedback_runs`에 저장해 offline scorer tuning에 재사용한다.
- 개발 실행은 `node --import tsx`를 사용하고, 프로덕션 빌드는 root의 `tsup.config.ts`를 따른다.

## 이후 추가될 것
- `memory_evidence` 같은 join table
- `sessions`, `session_state`
- FTS 관련 인덱스/virtual table 전략
- read repository 레이어

## 주의점
- 이 디렉터리의 스키마는 `spec/03-storage-and-schema.md`와 항상 맞춰야 한다.
- runtime이 쓰는 메모리 구조와 DB 구조가 어긋나면 이후 ingest와 MCP가 같이 흔들린다.
