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
- session-derived memory auto-promote policy

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
13. session-derived memory를 `hypothesis/emerging`로 저장하고 low-risk kind에 한해 자동 승격 규칙을 붙인다.
14. session memory용 summary normalization을 도입해 표면적인 문장 차이 때문에 memory가 분리되지 않게 한다.
15. semantic duplicate merge를 도입해 의미상 같은 memory를 자동 병합한다.
16. contradiction detection을 도입해 상충 memory를 자동 약화하거나 review 대상으로 보낸다.
17. `stability`를 retrieval rerank 신호에 반영해 `hypothesis/emerging` memory가 과도하게 상위에 뜨지 않게 한다.
18. `feedback_runs`를 기반으로 `scoring_patch_candidate`를 만드는 offline scorer review batch를 도입한다.
19. scorer weight와 memory state 보강을 분리한 inspect/eval 흐름을 정리해, ranking 문제와 memory 품질 문제를 따로 튜닝할 수 있게 한다.
20. raw conversation/evidence 취합과 memory 정제를 runtime 응답 경로에서 분리한 `refine`/`jobs` 레이어를 도입한다.
21. `personalm refine`, `personalm promote`, `personalm ingest` 같은 batch CLI를 추가해 로컬에서 수동/주기 실행 가능한 정제 파이프라인을 만든다.
22. 필요해지면 위 batch 경로를 long-running local worker나 containerized service로 확장하되, `MCP`와 background refinement 책임은 분리한다.
