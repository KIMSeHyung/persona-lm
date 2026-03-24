# mcp

이 디렉터리는 `persona-lm`을 MCP 서버 형태로 노출할 때의 인터페이스 계층이다.

핵심은, MCP가 persona를 "만드는" 계층이 아니라 persona data와 retrieval을 "제공하는" 계층이라는 점이다.

```text
mcp/
├── server.ts  # 공통 server definition
├── stdio.ts   # stdio transport 진입점
└── tools/     # tool contract
```

## 현재 상태
- 실제 MCP SDK 연결은 아직 없다.
- 대신 어떤 tool/resource를 노출할지에 대한 구조만 스캐폴드해둔 상태다.
- `stdio` 실행 시 `--mode` arg로 execution policy를 고를 수 있다.
- feedback pipeline을 위해 `submit_feedback` tool contract를 함께 유지한다.

## 이후 추가될 것
- MCP SDK 연결
- tool handler 구현
- resource handler 구현
- 필요 시 HTTP transport
