# runtime

이 디렉터리는 query 시점에 persona를 실제로 동작시키는 계층이다.

runtime은 메모리를 저장하는 곳이 아니라, 메모리를 어떤 방식으로 꺼내고 조립할지 결정하는 곳이다.

```text
runtime/
├── context/    # 항상 주입할 persona core
├── prompt/     # model에 넣을 컨텍스트 포맷
├── retrieval/  # query 관련 memory 선택
└── session/    # session state 타입과 로직
```

## 역할
- persona core 구성
- 관련 memory retrieval
- 최종 prompt context 조립
- session state 관리

## 이후 추가될 것
- request classification
- inspect mode
- runtime policy
- response verification
