# 로드맵

## Milestone 0
프로젝트 부트스트랩

상태:
- 완료

포함 내용:
- TypeScript 초기화
- SQLite + Drizzle 설정
- 초기 스키마 bootstrap

## Milestone 1
메모리 스키마 확장

목표:
- `memories` 구조 구체화
- `memory_evidence` 추가
- `session_state` 추가
- enum 과 status 정리
- `decision_playbook` shape 정의
- `decision_trace` shape 정의

## Milestone 2
Ingest 와 Compiler

목표:
- adapter interface
- normalize pipeline
- memory candidate 추출
- compiled memory 승격
- decision trace / playbook 추출 규칙 정리
- reviewed seed -> DB 적재 경로 정의

## Milestone 3
Runtime

목표:
- retrieval pipeline
- reranking
- session handling
- inspect mode 지원
- decision-oriented prompt / retrieval 경로 추가

## Milestone 4
MCP

목표:
- `stdio` 서버
- search/profile tool
- resource 노출

## 바로 다음 작업
1. 실제 memory kind 기준으로 스키마를 정교화한다.
2. `memory_evidence` 연결 구조를 정한다.
3. 첫 retrieval contract를 정한다.
4. `decision_rule`과 `decision_playbook`의 필드 구조를 정한다.
5. reviewed seed memory importer를 runtime read path와 연결한다.
6. MCP `--mode`를 runtime execution policy와 연결한다.
7. feedback pipeline과 `feedback_runs` logging을 붙인다.
8. MCP 기반 review bundle / patch candidate 워크플로우를 붙인다.
9. reviewed decision seed importer를 SQLite read path와 실제 runtime demo에 연결한다.
10. MCP 서버 엔트리 포인트를 스캐폴딩한다.
11. long-term memory `top N` candidate retrieval에 SQLite `FTS5`를 붙인다.
12. MCP SDK stdio 서버와 최소 tool handler를 실제로 연결한다.
