# seeds/persona

이 디렉터리는 특정 persona에 대한 수동 seed memory를 둔다.

## 현재 파일
- `decision-seed.data.ts`
  - 대화 분석 결과에서 나온 `decision_rule`, `decision_playbook`, `decision_trace`, `value` seed의 raw reviewed 데이터를 둔다.
- `decision-seed.ts`
  - `decision-seed.data.ts`의 raw seed를 `CompiledMemory`로 변환하는 loader와 helper를 둔다.

## 역할
- 초기 compiler가 없더라도 decision-oriented runtime을 테스트할 수 있게 한다.
- LLM이 뽑아낸 분석 결과를 reviewed seed로 프로젝트에 흡수하는 기준점이 된다.

## 원칙
- 데이터 정의와 runtime용 변환 함수를 같은 파일에 섞지 않는다.
- raw seed는 읽기 쉬운 데이터 묶음으로 유지한다.
- loader는 공개 API와 ID 생성, metadata 조립만 담당한다.

## 이후 방향
- persona별 seed 분리
- JSON import/export 지원
- reviewed candidate -> official memory 승격 경로 추가
