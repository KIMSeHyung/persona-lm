# 메모리 모델

## 핵심 개념
시스템은 import된 모든 텍스트를 곧바로 memory로 취급하지 않는다.

원문은 `evidence`로 저장하고, 그 위에서 해석과 승격 과정을 거쳐 구조화된 `compiled memory`를 만든다.

## 메모리 계층
1. `Evidence`
2. `MemoryCandidate`
3. `CompiledMemory`
4. `SessionState`

## Evidence
사용자 데이터에서 추출한 원문 단위다.

예시:
- 메신저의 메시지 1개
- SNS 게시물 1개
- 메모 문단 1개
- 과거 LLM 대화의 사용자 발화 1개

`Evidence`는 근거와 추적 가능성을 위한 레이어다.

## MemoryCandidate
추출은 되었지만 아직 충분히 신뢰하지 않은 해석 결과다.

예시:
- "짧고 단정한 답변을 선호하는 것 같음"
- "제품화보다 오픈소스 쪽을 자주 택하는 것 같음"

이 레이어가 필요한 이유는, 약한 패턴을 너무 빨리 정체성으로 승격시키지 않기 위해서다.

## CompiledMemory
실제 runtime이 참조하는 장기기억 레이어다.

### 메모리 타입
- `style_rule`
- `preference`
- `interest`
- `decision_rule`
- `decision_playbook`
- `self_description`
- `value`
- `episodic_memory`

### 공통 필드
- `id`
- `personaId`
- `kind`
- `summary`
- `canonicalText`
- `status`
- `confidence`
- `stability`
- `scope`
- `tags`
- `metadata`
- `createdAt`
- `updatedAt`

### 필수 상태값
- `confirmed`
- `hypothesis`
- `conflicted`
- `stale`

### 상태값이 중요한 이유
다음 요소를 섞어버리면 persona 품질이 급격히 떨어진다.

- 단발성 발언과 지속적 성향
- 공개용 말투와 기본 말투
- 일시적 기분과 오래가는 취향

## 의사결정 메모리 확장
의사결정 재현은 단순 `preference`만으로는 부족하다.

최소한 다음 두 층이 필요하다.

- `decision_rule`
  - 반복적으로 드러나는 판단 기준
  - 예: "구조 명확성을 확장성보다 우선한다"
- `decision_playbook`
  - 특정 도메인에서 어떤 순서와 기준으로 판단하는지 절차화한 표현
  - 예: 아키텍처 선택 시 local-first, 운영 복잡도, 동시성 요구를 순서대로 검토

## decision_playbook 필드 방향
`decision_playbook`은 일반 memory 공통 필드 외에 다음 정보를 포함할 수 있어야 한다.

- `domain`
- `trigger`
- `steps`
- `tradeoffAxes`
- `preferredOutcomes`
- `fallbackPolicy`
- `exceptions`

이 구조는 "내면의 사고를 완전히 복제"하려는 것이 아니라, 외부에 드러난 판단 절차를 재사용 가능한 형식으로 정리하는 것을 목표로 한다.

## SessionState
현재 대화 세션에서만 필요한 임시 메모리다.

예시:
- 이번 세션의 현재 목표
- 지금 논의 중인 주제
- 이번 대화에서 합의한 가정
- 최근 약속 또는 TODO

`SessionState`는 자동으로 장기기억으로 승격하면 안 된다.

## 승격 규칙
- 명시적인 자기 서술은 빠르게 승격할 수 있다.
- 여러 번 반복된 패턴은 confidence를 높인다.
- 단발성 사건은 우선 `episodic_memory`로 남긴다.
- 충돌하는 evidence는 덮어쓰지 않고 `conflicted` 또는 시간 범위가 있는 record로 남긴다.
- runtime은 raw evidence보다 compiled memory를 우선 사용한다.
