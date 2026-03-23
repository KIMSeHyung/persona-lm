# runtime/session

이 디렉터리는 현재 대화 세션에서만 유지되는 상태를 다룬다.

## 현재 파일
- `types.ts`
  - session summary의 최소 타입을 정의한다.

## 역할
- 현재 목표
- active topic
- 최근 약속
- 세션 갱신 시각

## 원칙
- session 정보는 long-term memory와 분리한다.
- 가치 있는 session 정보만 나중에 review 후 memory로 승격할 수 있게 한다.
