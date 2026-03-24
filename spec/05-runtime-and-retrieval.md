# Runtime 과 Retrieval

## Runtime 목표
구조화된 persona memory를 기반으로, 사용자를 어느 정도 닮은 응답을 일관되게 생성한다.

## Runtime 컨텍스트 계층
1. `persona core`
2. retrieved long-term memories
3. session summary
4. recent conversation turns

## Persona Core
항상 주입하는 짧고 안정적인 정체성 요약이다.

예시:
- 핵심 `style_rule`
- 핵심 `value`
- 핵심 `decision_rule`
- 짧은 `self_description`

`persona core`는 작고 안정적이어야 한다.

## Retrieval 흐름
1. 사용자 요청 의도를 분류한다.
2. 관련 memory와 evidence 후보를 가져온다.
3. 메타데이터와 relevance로 rerank 한다.
4. 최종적으로 소수의 context만 model에 주입한다.
5. 답변을 생성한다.
6. 필요 시 어떤 memory가 영향을 줬는지 inspect 한다.

## Retrieval 원칙
- 처음에는 필요한 것보다 넉넉하게 후보를 가져온다.
- 최종 주입 전 반드시 rerank 한다.
- 실제 prompt에는 작은 개수만 넣는다.
- compiled memory가 중심이 되어야 한다.
- raw evidence는 보조 근거와 검증 용도로 쓴다.

## Long-Term Memory Read Path
runtime이 long-term memory를 읽을 때의 기본 authoritative source는 SQLite `memories` 테이블이다.

개발 단계의 reviewed decision seed도 다음 형태로 연결한다.

1. reviewed seed를 importer가 SQLite `memories`에 upsert 한다.
2. runtime은 `src/db/memories.ts`를 통해 `CompiledMemory[]`로 hydrate 한다.
3. query retrieval이 필요하면 먼저 SQLite `memories_fts`에서 `top N` 후보를 가져온다.
4. retrieval, persona core, feedback pipeline은 hydrate된 long-term memory를 사용한다.
5. 최종 선택은 TypeScript scorer가 rerank 한다.

즉 reviewed seed는 코드에 존재하더라도, runtime 검증 경로에서는 가능하면 in-memory 배열 직접 주입보다 SQLite read path를 우선한다.

## FTS Candidate Retrieval
long-term memory retrieval은 다음 두 단계로 나눈다.

1. candidate retrieval
   - SQLite `FTS5`로 `summary`, `canonical text`, `tags`, `scope`에서 `top N` 후보를 가져온다.
2. rerank
   - runtime scorer가 `confidence`, `status`, `kind weight`, lexical overlap을 섞어 최종 순위를 정한다.

즉 `FTS`는 빠른 후보 검색기이고, persona에 실제로 주입할 memory를 결정하는 최종 판단기는 아니다.

## 의사결정 질문 처리
질문이 "무엇을 선택해야 하는가", "왜 이렇게 판단하는가" 같은 decision-oriented 요청이면 일반 retrieval만으로 끝내지 않는다.

우선순위는 다음과 같다.

1. 관련 `decision_playbook`
2. 관련 `decision_rule`
3. 관련 `value`
4. 관련 `episodic_memory`
5. 필요 시 supporting evidence

즉 단순 취향을 가져오는 것이 아니라, 판단 절차와 과거 선택 사례를 함께 주입해야 한다.

## Decision Runtime 방향
runtime은 필요 시 다음 방식으로 답변하게 할 수 있다.

- 먼저 관련 판단 축을 정리한다.
- `decision_playbook.steps`를 순서대로 검토한다.
- 현재 질문이 예외 조건에 해당하는지 본다.
- 관련 `decision_trace` 또는 `episodic_memory`를 근거로 붙인다.
- 확신이 낮으면 단정하지 않는다.

이 구조는 "LLM이 숨겨진 chain-of-thought를 재현"하는 것이 아니라, 외부화된 판단 규칙과 절차를 따르게 하는 방향이다.

## Runtime 모드
- `mirror`
- `inspect`

### Mirror
persona처럼 자연스럽게 답하는 기본 모드다.

### Inspect
어떤 memory와 evidence가 응답에 영향을 줬는지 보여주는 모드다.

## 실행 정책 모드
runtime의 답변 스타일 모드와 별개로, tool 호출과 피드백 루프를 제어하는 실행 정책 모드를 둔다.

- `dev_feedback`
  - 필요하다고 판단되면 사용자의 짧은 피드백을 먼저 요청하고, 저점수일 때 추가 tool call 기반 보강을 허용한다.
- `auto`
  - 사용자 피드백 없이 내부 점수와 정책에 따라 제한된 tool call만 허용한다.
- `locked`
  - 추가 tool call을 금지하고, 미리 준비된 context만으로 답변하게 한다.

초기 구현에서는 MCP 실행 arg의 `--mode` 값으로 이 정책을 고른다.
나중에는 이 값을 내부 `execution policy`로 해석해 다음 필드로 확장할 수 있어야 한다.

- `maxToolRounds`
- initial retrieval 이후 허용되는 추가 보강 round 수다.
- `allowUserFeedback`
- `allowRetryOnLowScore`
- `minFeedbackScoreForAcceptance`
- `minConfidenceForNoTool`

## 피드백 파이프라인
피드백 파이프라인은 "한 번 답하고 끝"이 아니라, 낮은 만족도일 때 retrieval과 context를 한 번 더 보강할 수 있게 하는 실행 루프다.

기본 흐름은 다음과 같다.

1. initial retrieval attempt를 실행한다.
2. attempt에 사용한 query, strategy, retrieved memory id/score를 inspect 가능한 형태로 남긴다.
3. 사용자가 점수와 이유를 주거나, system이 top memory confidence 부족을 감지하면 retry 필요 여부를 판단한다.
4. policy가 허용하면 query reformulation과 kind priority 조정을 거쳐 retrieval을 한 번 더 실행한다.
5. 마지막 attempt를 최종 context로 채택한다.
6. 전체 run을 SQLite `feedback_runs`에 기록한다.

## Decision Context 조립
decision, preference, value 질문은 여러 개의 작은 retrieval을 호스트가 직접 조합하는 것보다, 한 번의 decision context 조립으로 묶는 편이 안정적이다.

기본 방향은 다음과 같다.

1. `persona core`를 항상 함께 가져온다.
2. query와 관련된 `decision_playbook`, `decision_rule`, `decision_trace`, `value`를 우선 retrieval한다.
3. retrieval 결과가 비어 있으면 최소한의 rule/value/playbook은 high-confidence fallback으로 보강할 수 있다.
4. 최종 답변 전에는 이 묶음을 inspect 가능한 구조로 유지한다.

## Conversation-Unit Memory Save
세션 종료 시점만 기다리지 않고, 같은 LLM이 하나의 대화 단위에서 durable insight가 충분히 드러났다고 판단하면 durable memory candidate를 직접 저장할 수 있다.

기본 원칙은 다음과 같다.

1. 저장은 매 응답마다 자동으로 일어나지 않는다.
2. 사용자가 명시적으로 요청했거나, 하나의 대화 단위가 마무리되며 durable insight가 충분하다고 판단될 때 실행한다.
3. 저장 대상은 반복되거나 장기적으로 유지될 성향, 선호, 가치, 작업 방식 위주다.
4. 저장된 memory는 우선 `hypothesis` / `emerging` 상태로 둔다.
5. 같은 kind와 요약을 가진 memory가 이미 있으면 중복 insert보다 보강 update를 우선한다.

초기 자동 승격 규칙은 단순한 정책 기반으로 둔다.

1. 새 session-derived memory는 기본적으로 `hypothesis` / `emerging`으로 저장한다.
2. 같은 `kind + summary` memory가 서로 다른 세션에서 다시 저장되면, low-risk kind는 자동 승격할 수 있다.
3. 초기 auto-promote 대상은 `decision_rule`, `preference`, `value`로 제한한다.
4. 위 kind가 서로 다른 세션에서 2회 이상 저장되면 `confirmed` / `stable`로 승격한다.
5. `decision_trace` 같은 event성 memory는 자동 승격하지 않고 약한 상태를 유지한다.

## 현재 스코어링 보강 구조
현재 구현에서 scoring reinforcement는 "점수 함수 자체를 자동 학습"하는 방식이 아니라, memory state를 보강하고 retrieval이 그 state를 다시 읽는 구조다.

흐름은 다음과 같다.

1. query가 들어오면 SQLite `FTS5`가 lexical candidate `top N`을 가져온다.
2. runtime scorer가 lexical overlap, `confidence`, `status`, optional `kind weight`로 rerank 한다.
3. 대화 중 durable insight가 생기면 같은 LLM이 `save_session_memories`를 호출해 memory를 `hypothesis` / `emerging` 상태로 바로 `memories` 테이블에 저장한다.
4. 같은 `kind + summary` memory가 서로 다른 세션에서 반복되면 low-risk kind는 정책 기반으로 `confirmed` / `stable`로 승격한다.
5. 이후 retrieval은 더 강해진 `status`와 `confidence`를 다시 읽어 ranking에 반영한다.

즉 현재의 reinforcement는 다음 두 층을 가진다.

- memory 보강
  - `hypothesis/emerging` 저장
  - 반복 evidence 기반 승격
  - canonical text, tags, metadata 보강
- retrieval 보강
  - 저장된 `confidence`와 `status`를 rerank에 반영

현재 구현의 한계도 분명하다.

1. `stability`는 저장되지만 아직 retrieval 점수에 직접 반영되지 않는다.
2. feedback log를 바탕으로 scorer weight를 자동 조정하는 batch job은 아직 없다.
3. summary 기준 중복 판정이 단순해서 의미상 같은 memory가 분리될 수 있다.
4. 상충 memory를 자동 약화하는 contradiction detection이 아직 없다.

따라서 다음 단계의 scorer 보강은 "memory state 보강"과 "retrieval weight 보강"을 분리해서 진행해야 한다.
초기 우선순위는 다음과 같다.

1. `stability`를 rerank 신호에 포함한다.
2. `feedback_runs`를 기반으로 `scoring_patch_candidate`를 생성하는 offline review batch를 도입한다.
3. summary normalization / semantic duplicate merge / contradiction detection으로 memory state 보강 품질을 높인다.

이 구조의 목적은 다음 두 가지다.

- 사용자 응답 품질을 즉시 보강하기
- 나중에 scorer와 retrieval policy를 offline으로 튜닝할 로그를 축적하기

## Judgment 모듈
query 분류, feedback 해석, retry 전략 선택처럼 "판단" 성격의 로직은 `runtime/feedback`에 흩뿌리지 않고 `runtime/judgment` 모듈에 모은다.

초기 구현에서는 heuristic 규칙으로 시작한다.
예:

- decision-oriented query 분류
- `wrong_priority`, `missing_memory` 같은 feedback reason 해석
- retry query reformulation
- kind weight 조정

나중에는 같은 인터페이스 뒤에 model-backed judgment engine을 붙일 수 있어야 한다.

## Judgment 와 모델 재사용 원칙
judgment용으로 별도 LLM이 필수인 것은 아니다.

우선순위는 다음과 같다.

1. 현재 runtime에서 쓰는 모델을 재사용한다.
2. 필요하면 prompt/profile만 달리해 "judge role"로 호출한다.
3. 비용, 지연, 안정성 문제가 커질 때만 더 작은 전용 judge 모델을 분리한다.

즉 `judgment`는 "별도 모델"이 아니라 "별도 역할/모듈"로 먼저 설계한다.
중요한 것은 모델 분리가 아니라, heuristic과 model-backed 판단을 바꿔 끼울 수 있는 인터페이스를 유지하는 것이다.

## 피드백 입력 규칙
사용자 피드백은 최소한 다음 값을 다룬다.

- `score`
  - runtime 안에서는 `0.0 ~ 1.0` 실수로 다룬다.
  - SQLite 저장 시에는 `0 ~ 1000` 정수 스케일로 변환한다.
- `reason`
  - `missing_memory`
  - `wrong_priority`
  - `too_confident`
  - `style_mismatch`
  - `other`
- `missingAspect`
  - 빠진 기억, 판단 기준, 예외 조건, 표현 스타일 같은 보강 힌트다.
- `note`
  - 자유 텍스트 메모다.

## Retry 원칙
- retry는 무한 루프가 아니라 최대 1회의 추가 보강부터 시작한다.
- `locked` 모드에서는 retry를 금지한다.
- `dev_feedback` 모드에서는 사용자 피드백이 낮을 때 retry를 허용한다.
- `dev_feedback` 모드에서는 답변 품질이 약하다고 판단되면 짧은 score/reason 피드백을 먼저 요청할 수 있다.
- `auto` 모드에서는 사용자 피드백 없이도 top memory confidence가 낮으면 retry를 허용할 수 있다.
- retry 시에는 query reformulation, top-k 확대, decision kind 가중치 조정 정도까지만 허용하고 임의의 장시간 tool chain으로 확대하지 않는다.

## Feedback Log 원칙
- 각 feedback run은 initial attempt와 retry attempt를 모두 보존해야 한다.
- final answer만 저장하지 말고 intermediate retrieval 결과를 함께 남겨야 한다.
- 저장 로그는 inspect용이면서 동시에 scorer 튜닝용 eval seed 역할을 해야 한다.
- 초반에는 `feedback_runs.metadata_json` 하나에 attempt 목록을 넣고, 나중에 필요하면 별도 child table로 분리한다.

## 개발 단계의 보강 워크플로우
개발 단계에서는 scorer 보정과 memory 보강을 앱 내부의 완전 자동 파이프라인으로 바로 밀어넣지 않는다.

우선 구현 기준은 다음과 같다.

1. MCP로 `feedback_runs`, 관련 `memories`, 필요 시 `evidence`를 JSON bundle 형태로 조회한다.
2. 이 bundle을 기준으로 failure cluster 또는 review batch 단위로 판단한다.
3. 결과는 즉시 DB를 덮어쓰지 않고 `patch candidate` JSON으로 만든다.
4. 다시 MCP tool call로 patch candidate를 적재하거나 적용한다.

초기 산출물 예시는 다음과 같다.

- `feedback_review_bundle`
- `memory_patch_candidate`
- `new_memory_candidate`
- `scoring_patch_candidate`

즉 초기 구현의 기본 흐름은 `MCP 조회 -> JSON 일괄 판단 -> MCP 적재`다.
전 row를 개별 호출로 평가하기보다, 먼저 feedback run이나 failure cluster 단위로 묶어 판단하고 필요한 row만 세부 검토한다.

## 자동화 단계로의 확장
나중에 batch refinement를 더 자동화하고 싶으면 model-backed judgment engine을 붙일 수 있다.

이때도 우선순위는 다음과 같다.

1. 현재 runtime에서 쓰는 모델 계열을 재사용한다.
2. 자동 호출이 필요할 때만 API 또는 로컬 inference endpoint를 붙인다.

즉 개발 단계에서는 MCP 기반 review workflow를 우선하고, 완전 자동 배치 정제는 이후 단계에서 endpoint 기반으로 확장한다.

## 선택 신호
- memory kind
- confidence
- status
- source quality
- recency
- lexical relevance
- semantic relevance

## Session 원칙
- session state는 long-term memory와 분리한다.
- 모든 세션 정보를 자동 승격하지 않는다.
- 명시적 승인 또는 review 후 승격 가능하게 설계한다.
