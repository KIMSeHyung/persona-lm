# memory/compiler

이 디렉터리는 evidence에서 persona memory를 뽑아내는 로직을 담는다.

## 현재 파일
- `index.ts`
  - mock evidence의 특정 표현을 보고 `preference`, `decision_rule`, `style_rule` 후보를 생성한다.
  - 생성된 candidate를 compiled memory로 승격하는 간단한 흐름도 포함한다.

## 현재 구현의 의미
- 지금 코드는 품질 좋은 compiler라기보다 구조 검증용이다.
- "이런 evidence가 들어오면 이런 memory가 생긴다"는 골격을 먼저 만든 상태다.

## 나중에 바뀔 구조
현재는 특정 표현을 정적으로 매칭해서 memory 후보를 만든다.

이 방식은 scaffold 단계에서는 유용하지만, 실제 compiler는 다음처럼 확장할 예정이다.

1. `deterministic preprocessing`
   - authoredBySelf 필터
   - source/channel 정리
   - obvious pattern tagging
2. `LLM-assisted candidate extraction`
   - evidence 묶음을 읽고 memory type 분류
   - `preference`, `decision_rule`, `style_rule` 같은 후보 제안
   - 설명 가능한 `summary`와 `canonicalText` 생성
3. `deterministic promotion`
   - schema validation
   - 중복 병합
   - confidence/status 조정
   - compiled memory 승격 여부 결정

## 왜 전부 LLM에 맡기지 않는가
- 한 번의 발언을 지나치게 일반화할 수 있다.
- 공개용 말투와 기본 말투를 섞을 수 있다.
- 약한 evidence를 강한 identity claim으로 만들 수 있다.

그래서 LLM은 candidate를 제안하고, 최종 저장과 승격 판단은 시스템이 통제하는 구조를 기본으로 한다.

## 이후 추가될 것
- candidate dedupe
- cross-source merge
- confidence 계산 규칙
- LLM 보조 추출
