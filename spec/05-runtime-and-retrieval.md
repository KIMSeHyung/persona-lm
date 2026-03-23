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

## Runtime 모드
- `mirror`
- `inspect`

### Mirror
persona처럼 자연스럽게 답하는 기본 모드다.

### Inspect
어떤 memory와 evidence가 응답에 영향을 줬는지 보여주는 모드다.

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
