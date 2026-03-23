# ingest

이 디렉터리는 외부 데이터 소스를 `persona-lm` 내부 형식으로 가져오는 계층이다.

핵심 목표는 raw source를 곧바로 memory로 만들지 않고, 먼저 `normalized evidence`로 만드는 것이다.

```text
ingest/
├── adapters/    # source-specific parser
├── normalizer/  # 공통 evidence 형태로 변환
└── pipeline/    # ingest 흐름 조립
```

## 현재 상태
- 실제 카카오톡 parser는 아직 없다.
- 대신 mock messenger artifact를 기반으로 normalize 흐름을 검증하고 있다.

## 원칙
- source 포맷 차이는 `adapters/`에서 흡수한다.
- 내부 공통 형식으로의 변환은 `normalizer/`에서 처리한다.
- 여러 단계를 이어붙이는 orchestration은 `pipeline/`에서 담당한다.

## 이후 추가될 것
- notes import
- LLM export import
- SNS import
- source artifact 저장 전략
