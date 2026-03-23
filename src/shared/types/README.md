# shared/types

이 디렉터리는 도메인 공통 타입을 둔다.

## 현재 파일
- `memory.ts`
  - source type
  - memory kind
  - memory status
  - normalized evidence
  - memory candidate
  - compiled memory
  - retrieved memory

현재 memory kind에는 다음이 포함된다.
- `decision_rule`
- `decision_playbook`
- `decision_trace`
- `value`

현재 source type에는 reviewed seed를 위한 `seed`도 포함된다.

## 역할
- 현재 프로젝트에서 "메모리"가 무엇인지 공통 언어를 정의한다.
- DB, compiler, runtime, MCP가 같은 타입 모델을 바라보게 만든다.

## 이후 추가될 것
- session type
- ingest artifact type
- MCP payload type
