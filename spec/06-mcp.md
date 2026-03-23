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

- retrieval 전략
- rerank
- session policy
- prompt assembly

`MCP`는 store와 retrieval surface를 외부에 노출하는 계층이다.
