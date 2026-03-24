# runtime/prompt

이 디렉터리는 runtime이 선택한 context를 LLM 입력 형식으로 조립한다.

## 현재 파일
- `index.ts`
  - `persona core`와 retrieved memory를 사람이 읽기 쉬운 문자열 형식으로 출력한다.
- `run-persona-mirror.ts`
  - Codex CLI를 세션 한정 persona mirror 모드로 실행하는 launcher entry다.
- `persona-mirror.instructions.md`
  - Codex CLI나 다른 호스트가 그대로 주입할 수 있는 mirror 모드용 persona instruction 초안이다.

## 역할
- prompt assembly
- context formatting
- 재사용 가능한 host instruction asset 보관
- 세션 한정 launcher 지원
- 추후 model/provider별 포맷 분기 지점

## 이후 추가될 것
- system / developer / context layer 분리
- inspect mode용 설명 포맷
- tool result 반영 포맷
