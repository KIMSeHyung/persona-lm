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
- MCP stdio를 직접 띄울 때는 `node --import tsx src/mcp/stdio.ts --mode <dev_feedback|auto|locked>`를 사용한다.
- `pnpm mcp:stdio`는 로컬 수동 실행용으로만 보고, Codex CLI의 MCP 등록 커맨드로는 사용하지 않는다.

## Codex CLI에서 세션 한정 MCP 테스트
장기기억 검색과 persona core를 Codex CLI에서 테스트할 때는 MCP 서버를 글로벌로 등록하지 않고, 현재 실행 세션에만 주입한다.

### 1. 로컬 DB 준비

먼저 로컬 SQLite와 reviewed seed memory를 준비한다.

```bash
cd /Users/gimsehyeong/persona-llm
pnpm db:push
pnpm db:seed -- --persona persona_demo
```

### 2. Persona mirror 세션 시작

그다음 세션 한정 launcher를 사용한다.

`locked` 모드:

```bash
pnpm persona:mirror -- --mode locked "콘텐츠 버전 관리 관련 의사결정 성향을 말해줘"
```

`dev_feedback` 모드:

```bash
pnpm persona:mirror -- --mode dev_feedback "동시성과 idempotency를 어떻게 판단하는 편인지 말해줘"
```

이 launcher는 다음을 현재 Codex 실행 한 번에만 적용한다.
- `persona_lm` MCP stdio 서버를 세션 한정으로 주입한다.
- [persona-mirror.instructions.md](./src/runtime/prompt/persona-mirror.instructions.md) 내용을 첫 prompt에 포함한다.
- 글로벌 Codex 설정과 [AGENTS.md](./AGENTS.md)를 수정하지 않는다.

질문 없이 먼저 세션만 열고 싶다면 다음처럼 실행할 수 있다.

```bash
pnpm persona:mirror -- --mode locked
```

### 3. 세션 중 질문하기

세션 안에서는 주로 다음 성격의 질문에서 `persona_lm`을 우선 사용한다.

- 의사결정 성향
- 선호와 가치관
- 작업 방식
- 왜 그렇게 판단하는 편인지에 대한 질문

예:

```text
콘텐츠 버전 관리를 할 때 어떤 판단 순서를 따르는 편이야?
동시성과 재시도 안전성 중 뭘 더 먼저 보는 편이야?
구조를 먼저 잡는 편인지, 빠르게 구현하는 편인지 말해줘.
```

이때 내부적으로는 `get_decision_context`, `get_persona_core`, `search_memories` 같은 tool이 사용될 수 있지만, mirror 모드에서는 그 과정을 드러내지 않는 쪽을 기본으로 한다.

### 4. 세션 끝나기 전에 memory 저장

같은 세션의 LLM이 현재 대화 내용을 보고 장기기억 후보를 직접 저장할 수 있다.
세션 마지막에 아래처럼 요청하면 된다.

```text
이번 대화에서 장기기억으로 남길 만한 것만 저장해.
```

또는

```text
세션을 정리하고 durable한 memory만 남겨줘.
```

이 요청은 `save_session_memories`를 사용해 현재 대화에서 반복되거나 장기적으로 유지될 만한 성향, 선호, 가치, 작업 방식만 저장한다.
저장된 memory의 기본 상태는 `hypothesis` / `emerging`이다.

### 5. 자동 승격 규칙

세션에서 저장된 memory는 처음에는 약한 상태로 들어가지만, 일부 kind는 반복되면 자동 승격된다.

- 기본 저장 상태: `hypothesis` / `emerging`
- 자동 승격 대상: `decision_rule`, `preference`, `value`
- 승격 조건: 같은 `kind + summary`가 서로 다른 세션에서 다시 저장됨
- 승격 결과: `confirmed` / `stable`
- 자동 승격 제외: `decision_trace` 같은 event성 memory

현재 구현은 동일 요약 기준의 단순 규칙으로 승격한다.
향후에는 `summary normalization`, `semantic duplicate merge`, `contradiction detection`을 추가해 더 안정적으로 다듬는다.

주의:
- `pnpm mcp:stdio`는 `stdout`에 배너가 찍혀 MCP stdio 핸드셰이크를 깨뜨릴 수 있다.
- Codex CLI에서 MCP 서버를 붙일 때는 반드시 `node --import tsx src/mcp/stdio.ts ...` 형태를 사용한다.
- `pnpm persona:mirror`는 질문 문자열을 함께 넘기는 사용을 기본으로 한다. 질문 없이 실행하면 instruction만 먼저 전달된 세션이 열린다.

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
