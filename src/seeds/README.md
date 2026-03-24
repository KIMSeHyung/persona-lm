# seeds

이 디렉터리는 import 파이프라인 없이도 바로 사용할 수 있는 seed 데이터를 둔다.

## 역할
- 초기 persona 메모리 seed 제공
- reviewed candidate 저장
- retrieval과 runtime을 빠르게 검증할 수 있는 샘플 데이터 제공

## 원칙
- seed는 원문 전체가 아니라, 이미 사람이 검토한 구조화된 memory를 담는다.
- seed는 fixture이면서도 실제 runtime에서 바로 쓸 수 있는 형태여야 한다.

## 현재 구성
```text
seeds/
└── persona/
    ├── README.md
    ├── decision-seed.data.ts
    └── decision-seed.ts
```

## 파일 분리 원칙
- `*.data.ts`는 사람이 검토한 seed 데이터만 둔다.
- loader 함수나 `CompiledMemory` 생성 로직은 별도 파일에 둔다.
- raw seed와 runtime 전용 변환 함수를 한 파일에 섞지 않는다.
- SQLite 적재 로직은 `src/db/seed.ts`에서 담당하고, `src/seeds/`는 reviewed seed 정의와 loader만 가진다.
