# mcp/tools

이 디렉터리는 MCP tool의 이름과 입출력 계약(contract)을 정의한다.

## 현재 파일
- `contracts.ts`
  - `search_memories`, `get_decision_context`, `get_memory_evidence`, `get_persona_core`, `get_session_summary`, `save_session_memories`, `submit_feedback`의 기본 이름과 타입을 정의한다.

## 역할
- tool 이름 고정
- 요청/응답 shape 정리
- handler 구현 전 인터페이스 기준점 제공
- MCP SDK 등록 시 입력 schema와 structured result를 맞추는 기준점 제공

## 이후 추가될 것
- tool별 schema
- validation
- result payload 구체화
