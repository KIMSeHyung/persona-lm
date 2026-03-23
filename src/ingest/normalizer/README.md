# ingest/normalizer

이 디렉터리는 어댑터 출력물을 공통 `evidence` 형식으로 바꾸는 역할을 한다.

## 현재 파일
- `messenger.ts`
  - mock messenger artifact를 `NormalizedEvidenceUnit` 배열로 변환한다.

## 역할
- self / other 구분
- timestamp 보존
- room / channel 메타데이터 보존
- downstream compiler가 읽기 좋은 단위로 분해

## 원칙
- normalize는 의미 해석보다 구조 정리에 집중한다.
- 이후 compiler가 evidence를 다시 읽을 수 있도록 traceability를 유지해야 한다.
