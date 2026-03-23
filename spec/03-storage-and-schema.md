# 저장소와 스키마

## 기본 저장소 선택
기본 authoritative store는 `SQLite`다.

선택 이유:
- `local-first`에 잘 맞는다.
- 별도 DB 서버가 필요 없다.
- 백업과 이동이 단순하다.
- read-heavy 성격의 persona workload에 충분하다.

## 저장 계층
1. 디스크 위의 raw source 파일
2. SQLite 안의 normalized record
3. 키워드 검색을 위한 `FTS` 인덱스
4. 필요 시 semantic search를 위한 vector index

초기 단계에서는 여기에 더해, DB 적재 전에도 사용할 수 있는 `reviewed seed memory` 레이어를 코드 상에서 허용한다.

예:
- 사람이 검토한 `decision_rule` seed
- `decision_playbook` seed
- `decision_trace` seed
- `value` seed

이 seed는 최종 authoritative store를 대체하는 것이 아니라, compiler가 아직 완성되지 않았을 때 runtime과 retrieval을 검증하기 위한 임시 입력 경로다.

## 현재 구현된 테이블
- `personas`
- `evidence`
- `memories`

## 현재 코드 레벨의 보조 저장 경로
- `src/seeds/`

이 경로에는 DB에 아직 적재하지 않은 reviewed seed memory를 코드 형태로 둘 수 있다.
현재는 `seed`를 하나의 `sourceType`으로 사용해 in-memory compiled memory처럼 다루고 있다.

## 확장 예정 테이블
추후 스키마는 대략 다음 방향으로 확장한다.

- `personas`
- `source_artifacts`
- `evidence`
- `memory_candidates`
- `memories`
- `memory_evidence`
- `session_state`
- `sessions`

## 검색 전략
retrieval은 다음 하이브리드 구조를 기본으로 한다.

1. SQL 기반 structured filtering
2. `FTS` 기반 키워드/구문 검색
3. 필요 시 vector 기반 의미 유사도 검색
4. 최종 prompt 주입 전 rerank

## FTS 사용 원칙
`FTS`는 다음 텍스트에 우선 적용한다.

- evidence 본문
- memory summary
- memory canonical text

`FTS`는 후보를 찾는 용도이지, 최종 선택 로직 자체는 아니다.

## Vector 사용 원칙
vector search는 초기 버전에서 필수는 아니다.

도입한다면 우선순위는 다음과 같다.

- compiled memory
- 상대적으로 긴 evidence
- `episodic_memory`

vector search 하나에만 의존하는 구조는 피한다.

## 현재 스키마의 한계
지금의 Drizzle 스키마는 bootstrap 단계다.

추가로 필요한 것:
- richer memory fields
- evidence 링크용 join table
- session 관련 테이블
- retrieval에 필요한 index
- reviewed seed를 DB로 적재하는 seed command 또는 import path
