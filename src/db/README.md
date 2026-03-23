# db

이 디렉터리는 `persona-lm`의 영속 저장소 계층이다.

## 현재 파일
- `client.ts`
  - SQLite 파일 경로를 잡고 Drizzle client를 생성한다.
- `schema.ts`
  - 현재 bootstrap 단계의 테이블 정의를 담는다.

## 현재 역할
- authoritative store는 SQLite로 둔다.
- 앱 내부의 공식 데이터 구조는 이 계층을 기준으로 유지한다.

## 이후 추가될 것
- `memory_evidence` 같은 join table
- `sessions`, `session_state`
- FTS 관련 인덱스/virtual table 전략
- seed 또는 repository 레이어

## 주의점
- 이 디렉터리의 스키마는 `spec/03-storage-and-schema.md`와 항상 맞춰야 한다.
- runtime이 쓰는 메모리 구조와 DB 구조가 어긋나면 이후 ingest와 MCP가 같이 흔들린다.
