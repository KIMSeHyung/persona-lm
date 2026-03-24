# mcp

이 디렉터리는 `persona-lm`을 MCP 서버 형태로 노출할 때의 인터페이스 계층이다.

핵심은, MCP가 persona를 "만드는" 계층이 아니라 persona data와 retrieval을 "제공하는" 계층이라는 점이다.

```text
mcp/
├── handlers/  # tool/resource adapter
├── server.ts  # SDK server 구성
├── stdio.ts   # stdio transport 진입점
└── tools/     # tool contract
```

## 현재 상태
- stable TypeScript MCP SDK를 사용해 stdio 서버를 실제로 구동한다.
- `stdio` 실행 시 `--mode` arg로 execution policy를 고를 수 있다.
- 최소 tool surface는 `search_memories`, `get_persona_core`, `submit_feedback`를 우선한다.
- `get_memory_evidence`, `get_session_summary`는 compatibility surface로 유지하되 현재는 제한적으로 동작할 수 있다.

## 이후 추가될 것
- richer tool handler 구현
- resource handler 확장
- 필요 시 HTTP transport
