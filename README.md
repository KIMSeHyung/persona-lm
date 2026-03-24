# persona-lm

`persona-lm`은 개인의 글, 메모, SNS, 과거 대화 같은 데이터를 바탕으로 "그 사람답게 느껴지는" 페르소나를 만드는 로컬 우선(`local-first`) 오픈소스 프로젝트다.

이 프로젝트의 목표는 사람을 완전히 복제하는 것이 아니라, 구조화된 `memory`를 기반으로 말투, 취향, 관심사, 의사결정 경향을 어느 정도 닮은 `digital mirror`를 만드는 것이다.

## 핵심 아이디어
- 원문 데이터를 그대로 `RAG`에 넣는 대신, `evidence -> compiled memory` 구조로 정제한다.
- 실제 persona 동작은 runtime이 담당하고, `MCP`는 memory와 retrieval 기능을 제공하는 인터페이스 계층으로 둔다.
- 답변 품질의 핵심은 모델 자체보다, 데이터를 어떻게 정규화하고 memory로 승격하느냐에 있다.

## 현재 스택
- TypeScript
- pnpm
- SQLite
- Drizzle ORM
- Vitest
- `tsx` for local execution
- `tsup` for production bundling

## 개발 중 DB 반영
스키마를 자주 바꾸는 개발 단계에서는 `src/db/schema.ts`를 source of truth로 두고 `pnpm db:push`로 로컬 SQLite를 맞춘다.

마이그레이션 파일을 본격적으로 관리하는 흐름은 스키마가 어느 정도 안정된 뒤에 도입한다.

reviewed seed memory를 SQLite에 넣을 때는 `pnpm db:seed`를 사용한다.
SQLite `FTS5` 같은 support structure는 `drizzle/support/*.sql`에 두고, `pnpm db:push`가 schema push 뒤에 `db:bootstrap`까지 함께 실행한다.
이때 `drizzle.config.ts`의 `tablesFilter`로 Drizzle 관리 대상 테이블을 제한해 support structure를 삭제 대상으로 보지 않게 한다.

## 테스트 원칙
- 테스트 러너는 `Vitest`를 사용한다.
- 도메인별, 기능별 테스트는 `tests/` 아래에서 코드 구조를 따라 분리한다.
- 모든 코드 변경과 신규 기능은 관련 테스트를 먼저 추가하거나 기존 테스트를 먼저 갱신한 뒤 구현한다.
- 테스트가 빠진 기능 변경은 완료로 보지 않는다.

## 실행 방식
- 개발 실행은 `node --import tsx`를 사용한다.
- 타입체크는 `tsc --noEmit`만 사용한다.
- 프로덕션 빌드는 `tsup`으로 번들한 뒤 plain Node로 실행한다.
- 소스 코드의 상대 import는 확장자 없이 유지한다.
- MCP stdio 실행은 `pnpm mcp:stdio -- --mode <dev_feedback|auto|locked>` 형태로 구분한다.

## 테스트 실행
- `pnpm test`
- `pnpm test:run`

## 현재 상태
현재는 프로젝트 bootstrap 단계다.

구현된 내용:
- TypeScript 프로젝트 초기화
- SQLite + Drizzle 기본 설정
- 초기 테이블 생성: `personas`, `evidence`, `memories`
- 스펙 문서 정리
- mock messenger -> evidence -> memory -> retrieval 데모 스캐폴드
- reviewed decision seed memory 로더
- reviewed decision seed -> SQLite importer
- reviewed decision seed -> SQLite runtime read path
- SQLite `FTS5` 기반 long-term memory candidate retrieval
- feedback pipeline scaffold와 `feedback_runs` logging
- MCP SDK 기반 stdio server와 core tool handler 연결

아직 구현되지 않은 내용:
- 실제 ingest adapter
- 본격 memory compiler
- full MCP tool/resource surface 확장

## 문서
- 프로젝트 스펙 진입점: [spec/README.md](./spec/README.md)
- 작업 지침: [AGENTS.md](./AGENTS.md)

## 방향성
`persona-lm`은 다음 방향을 우선한다.

- 완전한 복제보다 "나답게 느껴지는 시뮬레이션"
- 서비스형 구조보다 로컬 우선
- 단순 RAG보다 structured memory
- 숨겨진 동작보다 inspectable runtime
