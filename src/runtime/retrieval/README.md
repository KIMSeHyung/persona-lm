# runtime/retrieval

이 디렉터리는 현재 query와 관련 있는 memory를 고르는 역할을 한다.

## 현재 파일
- `index.ts`
  - compiled memory 배열을 입력받아 score를 계산하고 상위 결과를 반환한다.

## 현재 의미
- 지금은 단순 top-k retrieval + score sort 수준이다.
- 이후에는 후보 생성과 rerank가 분리된 구조로 확장될 예정이다.

## 이후 추가될 것
- SQL filter
- FTS candidate generation
- vector candidate generation
- rerank policy
