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
- `feedback_runs`

## 현재 `personas` 테이블
- `id`
  - persona의 안정적인 내부 식별자다.
- `slug`
  - CLI, MCP, URL 친화적인 고유 문자열이다.
- `display_name`
  - 사용자에게 보여줄 persona 이름이다.
- `description`
  - persona의 짧은 설명 또는 메모다.
- `created_at`
  - persona record가 만들어진 시각이다.

## 현재 `evidence` 테이블
- `id`
  - evidence unit의 안정적인 식별자다.
- `artifact_id`
  - 어떤 raw source artifact에서 나왔는지 가리키는 상위 식별자다.
  - 아직 `source_artifacts` 테이블이 없으므로 우선 FK 없이 보관한다.
- `persona_id`
  - 이 evidence가 속한 persona 식별자다.
- `source_type`
  - `notes`, `llm_chat`, `sns`, `messenger`, `email`, `seed` 같은 source 분류다.
- `channel`
  - 동일 source 안의 세부 채널 또는 import 경로다.
  - 예: messenger room, email mailbox, notes folder
- `authored_by_self`
  - 사용자가 직접 작성한 텍스트인지 여부다.
- `author_label`
  - 표시용 화자 이름 또는 라벨이다.
- `content`
  - retrieval과 inspection의 기준이 되는 evidence 본문이다.
- `room_id`
  - 메신저 room, thread, mailbox thread 같은 대화 단위 식별자다.
- `tags_json`
  - normalize 과정에서 붙인 태그 배열을 JSON 문자열로 저장한다.
- `metadata_json`
  - source-specific 부가 정보를 JSON 문자열로 저장한다.
- `created_at`
  - 원문에 존재하는 작성 시각이다.
  - source에 timestamp가 없으면 `NULL`을 허용한다.

## 현재 `memories` 테이블
- `id`
  - compiled memory의 안정적인 식별자다.
- `persona_id`
  - 이 memory가 속한 persona 식별자다.
- `kind`
  - `style_rule`, `decision_rule`, `decision_playbook`, `value` 같은 memory 종류다.
- `summary`
  - 짧은 요약 문장이다.
  - persona core나 목록 UI에서 빠르게 보여주기 위한 필드다.
- `canonical_text`
  - retrieval과 FTS의 기본 검색 대상으로 삼는 정규화 텍스트다.
  - `decision_playbook`이면 핵심 절차까지 풀어쓴 검색용 문장을 포함할 수 있다.
- `status`
  - `confirmed`, `hypothesis`, `conflicted`, `stale` 같은 상태값이다.
- `confidence`
  - 저장용 confidence 점수다.
  - SQLite에서는 `0 ~ 1000` 정수 스케일을 사용한다.
- `stability`
  - 이 memory가 얼마나 안정적인지 나타내는 값이다.
  - `volatile`, `emerging`, `stable` 중 하나를 쓴다.
- `scope_json`
  - 적용 범위나 도메인 축 배열을 JSON 문자열로 저장한다.
- `tags_json`
  - retrieval과 inspect에 쓰는 태그 배열을 JSON 문자열로 저장한다.
- `source_types_json`
  - 이 memory를 형성한 source type 배열을 JSON 문자열로 저장한다.
- `evidence_ids_json`
  - 연결된 evidence id 배열을 JSON 문자열로 저장한다.
  - 추후 `memory_evidence` join table이 들어오면 보조 필드 또는 migration 대상이 될 수 있다.
- `metadata_json`
  - kind별 상세 구조를 JSON 문자열로 저장한다.
  - 예: `decision_playbook.steps`, `tradeoffAxes`, `exceptions`
- `created_at`
  - memory row가 생성된 시각이다.
- `updated_at`
  - memory row가 마지막으로 갱신된 시각이다.
- `valid_from`
  - 이 memory가 유효하다고 보는 시작 시각이다.
  - 현재 상태와 과거 상태를 분리할 때 쓴다.
- `valid_to`
  - 이 memory의 유효 종료 시각이다.
  - 현재도 유효하면 `NULL`이다.

## 현재 `feedback_runs` 테이블
- `id`
  - 하나의 피드백 파이프라인 실행을 식별하는 안정적인 id다.
- `persona_id`
  - 이 feedback run이 속한 persona 식별자다.
- `session_id`
  - 세션이 있는 경우 현재 대화 세션 식별자를 저장한다.
  - 세션 맥락이 없으면 `NULL`을 허용한다.
- `mode`
  - 실행 정책 모드다.
  - `dev_feedback`, `auto`, `locked` 중 하나를 사용한다.
- `query`
  - 사용자의 원본 질의다.
- `decision_query`
  - 이 질의가 decision-oriented query로 분류되었는지 나타낸다.
- `feedback_score`
  - 사용자가 준 피드백 점수다.
  - SQLite에서는 `0 ~ 1000` 정수 스케일을 사용하고, 피드백이 없으면 `NULL`이다.
- `feedback_reason`
  - 낮은 점수의 주된 이유를 저장한다.
  - 예: `missing_memory`, `wrong_priority`, `too_confident`, `style_mismatch`, `other`
- `missing_aspect`
  - 사용자가 빠졌다고 본 관점이나 키워드를 저장한다.
- `retry_triggered`
  - 피드백이나 낮은 retrieval confidence 때문에 추가 보강 시도가 있었는지 나타낸다.
- `retry_reason`
  - retry가 일어난 직접 이유를 저장한다.
  - 예: `user_feedback`, `low_confidence`
- `attempt_count`
  - initial attempt를 포함한 전체 retrieval 시도 횟수다.
- `final_attempt_number`
  - 최종 응답 구성에 채택된 attempt 번호다.
- `metadata_json`
  - 각 attempt의 query, strategy, retrieved memory id/score 목록, note를 JSON 문자열로 저장한다.
  - offline scorer tuning과 replay inspect의 원본 로그 역할을 한다.
- `created_at`
  - feedback run이 기록된 시각이다.

## 현재 코드 레벨의 보조 저장 경로
- `src/seeds/`
- `src/db/seed.ts`

이 경로에는 DB에 아직 적재하지 않은 reviewed seed memory를 코드 형태로 둘 수 있다.
현재는 `seed`를 하나의 `sourceType`으로 사용해 in-memory compiled memory처럼 다루고 있다.
`src/db/seed.ts`는 reviewed seed를 SQLite `memories` 테이블에 upsert 하는 개발용 importer 진입점이다.

## 확장 예정 테이블
추후 스키마는 대략 다음 방향으로 확장한다.

- `personas`
- `source_artifacts`
- `evidence`
- `memory_candidates`
- `memories`
- `feedback_runs`
- `memory_evidence`
- `session_state`
- `sessions`

## 검색 전략
retrieval은 다음 하이브리드 구조를 기본으로 한다.

1. SQL 기반 structured filtering
2. `FTS` 기반 키워드/구문 검색
3. 필요 시 vector 기반 의미 유사도 검색
4. 최종 prompt 주입 전 rerank

## 개발 단계의 스키마 반영 방식
현재처럼 스키마가 빠르게 변하는 단계에서는 `src/db/schema.ts`를 source of truth로 두고 `drizzle-kit push`로 로컬 DB에 반영하는 흐름을 기본으로 한다.

정식 migration 파일을 지속적으로 관리하는 방식은 memory/evidence shape가 어느 정도 안정된 이후로 미룬다.

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
- evidence 링크용 join table
- session 관련 테이블
- retrieval에 필요한 index
- feedback run 요약/통계용 read repository
