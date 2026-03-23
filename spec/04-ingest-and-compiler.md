# Ingest 와 Compiler

## 데이터 소스 우선순위
초기 import 우선순위는 다음과 같다.

1. 개인 글과 메모
2. 과거 LLM 대화 export
3. SNS export
4. 메신저 데이터
5. 이메일

메신저와 이메일은 제3자 데이터와 개인정보 문맥이 강해서 후순위로 둔다.

## Ingest 파이프라인
1. raw source import
2. metadata normalize
3. evidence 단위로 분해
4. memory candidate 추출
5. candidate 병합 및 점수화
6. compiled memory로 승격

## Normalize 목표
- 사용자가 직접 쓴 텍스트인지 구분한다.
- 타임스탬프를 보존한다.
- source/channel 종류를 보존한다.
- 필요한 경우 참여자 정보를 보존한다.
- evidence reference가 안정적으로 유지되게 한다.

## Compiler 휴리스틱
- 명시적 자기서술은 높은 가중치를 준다.
- 여러 source에서 반복된 패턴은 confidence를 높인다.
- 변동성이 큰 취향은 최근 evidence를 더 본다.
- stable trait는 episodic event보다 더 강한 근거를 요구한다.
- 공개용 SNS 말투를 곧바로 기본 말투로 일반화하지 않는다.

## 프라이버시와 노이즈 처리
메신저와 이메일 import에서는 다음을 조심해야 한다.

- 상대방 말투를 사용자 말투로 오인하지 않기
- 인용/전달된 텍스트를 사용자 신념으로 오인하지 않기
- 반응성 메시지를 지속적 성향으로 과대해석하지 않기

## Compiler 출력물
compiler는 최소한 다음을 만들어야 한다.

- compiled memory
- evidence link
- confidence 와 status
- 필요 시 사람이 읽을 수 있는 compile note
