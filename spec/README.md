# 스펙 인덱스

이 폴더는 `persona-lm`의 기획과 아키텍처에 대한 기준 문서다.

구현 전에 아래 순서대로 읽는 것을 기준으로 한다.

1. `01-scope.md`
2. `02-memory-model.md`
3. `03-storage-and-schema.md`
4. `04-ingest-and-compiler.md`
5. `05-runtime-and-retrieval.md`
6. `06-mcp.md`
7. `07-repo-layout.md`
8. `08-roadmap.md`

## 폴더 구조
```text
spec/
├── README.md
├── 01-scope.md
├── 02-memory-model.md
├── 03-storage-and-schema.md
├── 04-ingest-and-compiler.md
├── 05-runtime-and-retrieval.md
├── 06-mcp.md
├── 07-repo-layout.md
└── 08-roadmap.md
```

## 핵심 원칙
- 완전한 복제보다 "나답게 느껴지는 시뮬레이션"을 우선한다.
- 원문 전체를 바로 쓰는 `RAG`보다 `compiled memory`를 우선한다.
- 서비스형 구조보다 `local-first`를 기본으로 둔다.
- 내부 동작이 보이는 `inspectability`를 중요하게 본다.
- 단순 `top-k` 검색보다 구조화된 retrieval과 rerank를 우선한다.

## 현재 구현 상태
- 프로젝트 초기화 완료
- SQLite + Drizzle 기본 설정 완료
- 초기 테이블 존재: `personas`, `evidence`, `memories`
- memory compiler, runtime, MCP 서버는 아직 본격 구현 전
