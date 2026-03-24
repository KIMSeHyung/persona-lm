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
  - 사용자 피드백을 받고, 저점수일 때 추가 tool call 기반 보강을 허용한다.
- `auto`
  - 사용자 피드백 없이 내부 점수와 정책에 따라 제한된 tool call만 허용한다.
- `locked`
  - 추가 tool call을 금지하고, 미리 준비된 context만으로 답변하게 한다.

초기 구현에서는 MCP 실행 arg의 `--mode` 값으로 이 정책을 고른다.
나중에는 이 값을 내부 `execution policy`로 해석해 다음 필드로 확장할 수 있어야 한다.

- `maxToolRounds`
- `allowUserFeedback`
- `allowRetryOnLowScore`
- `minScoreForRetry`
- `minConfidenceForNoTool`

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
