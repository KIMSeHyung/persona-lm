# runtime/feedback

이 디렉터리는 feedback score와 retrieval inspect 결과를 바탕으로, 한 번 더 보강할지 결정하는 실행 루프를 담는다.

## 현재 역할
- initial retrieval attempt 생성
- 낮은 사용자 점수나 낮은 retrieval confidence 기준으로 retry 여부 판단
- retry query reformulation
- attempt snapshot 직렬화용 구조 제공
- 실제 판단 규칙은 `runtime/judgment` 모듈을 통해 주입받는다.

## 현재 범위
- 최대 1회의 추가 retry만 지원한다.
- retry 전략은 query 확장과 decision kind 가중치 조정 수준에서 시작한다.
- 최종 run 기록은 `src/db/feedback.ts`가 `feedback_runs`로 저장한다.
- 현재는 heuristic judgment engine을 기본으로 쓰고, 나중에 같은 인터페이스 뒤에 model-backed engine을 연결할 수 있다.
