# ingest/pipeline

이 디렉터리는 ingest 단계 전체를 조립하는 진입점들을 둔다.

## 현재 파일
- `index.ts`
  - mock messenger artifact를 normalize 해서 evidence 배열로 반환한다.

## 역할
- adapter와 normalizer를 묶는다.
- 이후에는 source import workflow의 기본 진입점이 된다.

## 이후 추가될 것
- source artifact 저장
- ingest 결과 요약
- batch import 흐름
- compile 전 전처리 훅
