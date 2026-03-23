# ingest/adapters

이 디렉터리는 source마다 다른 원본 포맷을 읽는 어댑터를 둔다.

## 현재 파일
- `messenger.mock.ts`
  - 실제 export 파일 대신, messenger 형태를 흉내 내는 fixture다.
  - memory compiler와 retrieval을 먼저 검증하기 위한 입력 역할을 한다.

## 역할
- source-specific parsing
- 메타데이터 보존
- 채널별 차이 흡수

## 이후 추가될 것
- `kakao.ts`
- `notes.ts`
- `sns.ts`
- `llm-chat.ts`

## 원칙
- 어댑터는 가능한 한 해석을 적게 하고 구조만 맞춘다.
- "이 말이 preference인가?" 같은 판단은 여기서 하지 않는다.
