# runtime

이 디렉터리는 query 시점에 persona를 실제로 동작시키는 계층이다.

runtime은 메모리를 저장하는 곳이 아니라, 메모리를 어떤 방식으로 꺼내고 조립할지 결정하는 곳이다.

```text
runtime/
├── context/    # 항상 주입할 persona core
├── feedback/   # feedback loop와 retry orchestration
├── judgment/   # heuristic 또는 model-backed 판단 모듈
├── prompt/     # model에 넣을 컨텍스트 포맷과 host instruction asset
├── retrieval/  # query 관련 memory 선택
└── session/    # session state 타입과 로직
```

## 역할
- persona core 구성
- 관련 memory retrieval
- feedback 기반 retry 판단과 attempt logging
- query 분류와 retry 전략 판단
- 최종 prompt context 조립
- session state 관리

## 현재 데모 기준
- style query와 decision query를 분리해 retrieval하는 샘플 흐름이 있다.
- reviewed seed memory를 함께 주입해 decision-oriented retrieval이 가능한 상태다.

## 이후 추가될 것
- request classification
- inspect mode
- runtime policy
- response verification

## 실행 정책 방향
- `dev_feedback`, `auto`, `locked` 같은 execution mode를 둔다.
- 초기에는 MCP 실행 arg가 mode를 고른다.
- 이후에는 mode를 내부 policy 객체로 해석해 tool budget, retry, feedback 수집 규칙을 세분화한다.
- feedback pipeline은 initial attempt와 optional retry attempt를 모두 inspect 가능한 형태로 보존한다.
- heuristic 판단 로직은 `judgment` 모듈에 두고, 나중에 같은 인터페이스 뒤에 model-backed judge를 연결할 수 있게 유지한다.
