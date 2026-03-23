# memory

이 디렉터리는 persona의 핵심인 장기기억 계층을 담당한다.

중요한 점은, 원문 전체를 바로 쓰지 않고 `candidate -> compiled memory` 구조를 거친다는 것이다.

```text
memory/
├── compiler/  # evidence -> candidate -> compiled memory
├── scoring/   # memory relevance / ranking score
└── models.ts  # memory 생성과 승격 모델
```

## 현재 상태
- rule-based mock compiler만 들어 있다.
- 실제 LLM-assisted compiler나 batch merge 로직은 아직 없다.

## 역할
- memory candidate 생성
- compiled memory 승격
- memory relevance scoring

## Compiler 방향
최종적으로는 `rule-only`가 아니라 `rule + LLM` 하이브리드 구조를 목표로 한다.

기본 흐름은 다음과 같다.

1. `rules/filter`
   - self / other 구분
   - source metadata 정리
   - 너무 짧거나 noisy한 evidence 제외
   - 명시적인 패턴 태깅
2. `LLM extraction`
   - evidence를 읽고 `MemoryCandidate` 제안
   - `kind`, `summary`, `canonicalText`, `confidence` 후보 생성
3. `post-validation`
   - schema 검증
   - evidence link 유지
   - dedupe / merge
   - status 와 promotion 결정

즉 LLM은 최종 truth를 직접 저장하는 계층이 아니라, `memory candidate extractor`로 사용하는 방향이 기본이다.

## 이후 추가될 것
- candidate merge
- evidence link aggregation
- conflict handling
- time-bounded memory 처리
