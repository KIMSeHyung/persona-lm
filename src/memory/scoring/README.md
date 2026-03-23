# memory/scoring

이 디렉터리는 memory retrieval 점수 계산 로직을 둔다.

## 현재 파일
- `index.ts`
  - query token과 memory text를 단순 비교해서 lexical score를 만든다.
  - memory `status`와 `confidence`를 함께 반영한다.

## 역할
- retrieval 후보 재정렬
- query와 memory의 관련도 계산
- 향후 vector/FTS 점수와 메타데이터 점수를 합치는 중심 지점

## 현재 한계
- 현재는 매우 단순한 token 기반 방식이다.
- FTS, semantic retrieval, source weight는 아직 반영하지 않는다.
