# shared

이 디렉터리는 여러 계층에서 공통으로 사용하는 타입과 유틸리티를 둔다.

## 현재 파일
- `ids.ts`
  - prefix 기반 ID 생성 유틸리티
- `utils/`
  - confidence scale 변환 같은 공통 유틸리티
- `types/`
  - memory 관련 공통 타입 정의

## 역할
- 여러 계층이 같은 도메인 용어를 공유하도록 한다.
- ingest, memory, runtime, mcp 사이 타입 불일치를 줄인다.

## 원칙
- 특정 계층에만 필요한 로직은 여기 두지 않는다.
- 공통 타입과 재사용 유틸만 둔다.
