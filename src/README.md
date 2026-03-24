# src

이 디렉터리는 `persona-lm`의 실제 구현 코드를 담는 루트다.

현재 구조는 스캐폴드 단계이며, 큰 책임은 다음처럼 나뉜다.

```text
src/
├── db/        # SQLite/Drizzle 저장소
├── ingest/    # raw source -> normalized evidence
├── mcp/       # MCP 인터페이스 계층
├── memory/    # candidate / compiled memory 로직
├── runtime/   # retrieval, prompt, session 조립
├── seeds/     # reviewed seed memory and fixtures
├── shared/    # 공통 타입과 유틸
└── index.ts   # 현재 데모용 엔트리 포인트
```

구현 테스트는 루트 `tests/` 아래에서 `src/` 구조를 따라 대응시킨다.

## 현재 상태
- `index.ts`는 실제 앱 진입점이라기보다 scaffold 검증용 샘플 흐름이다.
- mock messenger 데이터가 들어와 memory로 변환되고, reviewed decision seed는 SQLite에 적재된 뒤 다시 읽혀 retrieval과 persona context formatting까지 이어지는 예제를 보여준다.
- DB support migration bootstrap 이후에 long-term memory `FTS5` candidate retrieval이 동작한다.
- long-term memory query는 SQLite `FTS5`로 `top N` 후보를 먼저 추린 뒤 runtime scorer가 다시 정렬한다.
- feedback pipeline은 initial retrieval과 optional retry를 runtime 차원에서 실험할 수 있는 상태다.

## 앞으로의 방향
- `db/`는 richer schema와 session 테이블을 포함하도록 확장한다.
- `ingest/`는 실제 source adapter를 추가한다.
- `memory/`는 compiler와 memory promotion 규칙의 중심이 된다.
- `runtime/`은 실제 chat orchestration 계층이 된다.
- `mcp/`는 외부 LLM이 persona data를 읽는 인터페이스가 된다.
- `seeds/`는 수동 검토된 memory seed와 fixture를 담고, raw seed 데이터와 loader를 분리해 유지한다.
