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

## Milestone 2
Ingest 와 Compiler

목표:
- adapter interface
- normalize pipeline
- memory candidate 추출
- compiled memory 승격

## Milestone 3
Runtime

목표:
- retrieval pipeline
- reranking
- session handling
- inspect mode 지원

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
4. MCP 서버 엔트리 포인트를 스캐폴딩한다.
