# MCP

## MCP의 역할
`MCP`는 persona data와 retrieval 기능을 외부 LLM이 읽을 수 있게 해주는 인터페이스 계층이다.

`MCP` 자체가 memory compiler는 아니다.

## 초기 transport 선택
우선은 `stdio` transport로 시작한다.

이유:
- 로컬 개발이 가장 단순하다.
- 항상 켜져 있는 서버가 필요 없다.
- `local-first` 방향과 잘 맞는다.

실제로 startup cost가 병목이 되면, 그때 장수 프로세스 기반 HTTP transport를 별도로 추가한다.

## stdio 실행 모드
초기 구현에서는 stdio MCP 서버를 실행할 때 `--mode` arg로 실행 정책을 고른다.

예:
- `pnpm mcp:stdio -- --mode dev_feedback`
- `pnpm mcp:stdio -- --mode auto`
- `pnpm mcp:stdio -- --mode locked`

이 `mode`는 MCP transport 자체의 종류가 아니라, runtime의 tool orchestration 정책을 고르는 값이다.
외부 인터페이스는 단순한 enum으로 유지하고, 내부에서는 나중에 richer policy 객체로 해석할 수 있어야 한다.

## 권장 MCP 구조
공통 로직과 transport별 엔트리 포인트를 분리한다.

```text
src/mcp/
├── server.ts
├── stdio.ts
└── http.ts
```

## 초기 tool 제안
- `search_memories`
- `get_memory_evidence`
- `get_persona_core`
- `get_session_summary`
- `submit_feedback`

개발 단계의 보강 워크플로우에서는 다음 성격의 tool을 추가할 수 있다.

- `get_feedback_review_bundle`
  - 특정 persona, 기간, reason, domain 기준으로 review 대상 JSON bundle을 반환한다.
- `apply_review_patches`
  - review batch에서 생성한 patch candidate를 저장하거나 적용한다.

초기에는 이 두 tool이 실제 이름 그대로 확정되지 않아도 된다.
중요한 것은 MCP를 통해 review용 bundle을 조회하고, candidate patch를 다시 적재하는 흐름을 유지하는 것이다.

## 초기 resource 제안
- `persona://default/core`
- `persona://default/profile`
- `persona://memory/{id}`

## 설계 원칙
- 초반에는 tool 수를 적게 유지한다.
- 구조화된 payload를 반환한다.
- 여러 번의 작은 tool call보다, 한 번의 가치 있는 조회를 우선한다.
- 모델이 persona 정보를 한 개씩 일일이 가져오게 만들지 않는다.

## Runtime 과의 관계
내부 runtime은 계속 다음 책임을 가진다.

- SQLite `FTS` 기반 candidate retrieval
- retrieval 전략
- rerank
- session policy
- tool budget 와 retry 정책
- feedback pipeline logging
- prompt assembly

`MCP`는 store와 retrieval surface를 외부에 노출하는 계층이다.

개발 단계의 scorer/memory 보강도 우선은 이 MCP surface를 통해 수행한다.
즉 앱 내부 코드가 직접 모델 endpoint를 호출해 즉시 정제하는 구조보다, MCP로 JSON bundle을 받고 review 결과를 다시 MCP로 적재하는 반수동 workflow를 먼저 구현한다.
