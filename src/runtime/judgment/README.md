# runtime/judgment

이 디렉터리는 query 분류, feedback 해석, retry 전략 선택처럼 판단 성격의 로직을 모은다.

## 현재 역할
- decision-oriented query 분류
- retry 이유 선택
- retry query reformulation
- kind weight 전략 제공

## 확장 방향
- 초기 구현은 heuristic 규칙으로 시작한다.
- 나중에는 같은 인터페이스 뒤에 model-backed judgment engine을 연결할 수 있다.
- judgment는 별도 모델이 아니라 별도 역할이며, 필요하면 runtime에서 쓰는 모델을 그대로 재사용할 수 있다.
