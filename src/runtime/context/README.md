# runtime/context

이 디렉터리는 항상 주입할 `persona core`를 조립하는 역할을 한다.

## 현재 파일
- `persona-core.ts`
  - compiled memory 중 핵심 `style_rule`, `decision_rule`, `preference`, `self_description`를 뽑아 compact context를 만든다.

## 역할
- 장기기억 전체를 매번 다 넣지 않고, 핵심 정체성만 짧게 유지한다.
- 이후 retrieval 결과와 별도로 항상 주입할 내용을 만든다.

## 이후 추가될 것
- core memory selection 규칙
- persona profile 생성
- mode별 core shaping
