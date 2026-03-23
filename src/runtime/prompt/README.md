# runtime/prompt

이 디렉터리는 runtime이 선택한 context를 LLM 입력 형식으로 조립한다.

## 현재 파일
- `index.ts`
  - `persona core`와 retrieved memory를 사람이 읽기 쉬운 문자열 형식으로 출력한다.

## 역할
- prompt assembly
- context formatting
- 추후 model/provider별 포맷 분기 지점

## 이후 추가될 것
- system / developer / context layer 분리
- inspect mode용 설명 포맷
- tool result 반영 포맷
