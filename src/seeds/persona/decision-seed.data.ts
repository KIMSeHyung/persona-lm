import type { MemoryStatus, SourceType } from "../../shared/types/memory.js";

export interface SeedEvidence {
  quote: string;
  reason: string;
}

export interface DecisionRuleSeed {
  summary: string;
  canonicalText: string;
  confidence: number;
  status: MemoryStatus;
  scope: string[];
  evidence: SeedEvidence[];
}

export interface TradeoffAxis {
  axis: string;
  preferredSide: string;
  reason: string;
}

export interface DecisionPlaybookSeed {
  domain: string;
  summary: string;
  trigger: string;
  steps: string[];
  tradeoffAxes: TradeoffAxis[];
  exceptions: string[];
  confidence: number;
  status: MemoryStatus;
  evidence: SeedEvidence[];
}

export interface DecisionTraceSeed {
  context: string;
  decision: string;
  alternatives: string[];
  reasoning: string;
  confidence: number;
  status: MemoryStatus;
  evidence: SeedEvidence[];
}

export interface ValueSeed {
  summary: string;
  canonicalText: string;
  confidence: number;
  status: MemoryStatus;
  scope: string[];
  derivedFrom: string[];
}

export const decisionSeedSourceType: SourceType = "seed";
export const decisionSeedTimestamp = "2026-03-23T00:00:00.000Z";

export const conversationDecisionRuleSeeds: DecisionRuleSeed[] = [
  {
    summary: "문제 범위를 먼저 줄인 뒤 푼다",
    canonicalText:
      "기능을 설계할 때 모든 가능성을 한 번에 품기보다, 현재 꼭 필요한 범위만 남기고 문제를 축소하는 경향이 있다. 특히 협업 제외, 특정 워크로드 한정, 검증용/운영용 구분처럼 범위 제한을 먼저 건다.",
    confidence: 0.89,
    status: "confirmed",
    scope: ["product_scope", "system_design", "architecture_choice"],
    evidence: [
      {
        quote: "협업 기능이 없는 개인 기반 문서 서비스",
        reason: "초기부터 협업을 제외해 문제를 줄이는 선택을 했다."
      },
      {
        quote: "웹서비스 개발로는 별로네, ai/ml job들에 한해서지?",
        reason: "도구 적용 범위를 특정 워크로드로 빠르게 제한한다."
      },
      {
        quote: "직접 확인 해 보고 싶을때 쓰는 정도에 적합한가?",
        reason: "검증용과 운영용을 분리해 범위를 줄여 판단한다."
      }
    ]
  },
  {
    summary: "운영비와 유지 부담을 기술 선택의 초기에 계산한다",
    canonicalText:
      "기술이나 제품을 볼 때 기능 가능 여부만 확인하지 않고, 운영비, 전력, 상시 구동 부담, 연결 수, 배포 불편, 인프라 제약 같은 현실 비용을 초기 판단에 포함하는 경향이 있다.",
    confidence: 0.92,
    status: "confirmed",
    scope: ["infra_cost", "operations", "tool_selection", "product_strategy"],
    evidence: [
      {
        quote: "실행환경을 제공해야 하는데 비용문제가 있지 않을까",
        reason: "아이디어 단계에서 곧바로 운영비를 계산한다."
      },
      {
        quote: "4090 그래픽카드 소비전력 몇와트야",
        reason: "성능 논의와 함께 전력 비용을 묻는다."
      },
      {
        quote: "RDS Proxy vs direct",
        reason: "운영 안정성과 연결 관리 비용을 설계 판단축으로 둔다."
      },
      {
        quote: "Prd 레벨에서 불편함",
        reason: "운영 단계의 마찰을 추상적 장점보다 앞세운다."
      }
    ]
  },
  {
    summary: "정적 테이블보다 흐름, 상태 전이, 실시간성을 중시한다",
    canonicalText:
      "시스템을 볼 때 단순 CRUD 저장소보다 이벤트 흐름, 스트리밍 처리, 상태 전이, 실시간 계산 파이프라인으로 이해하려는 경향이 있다.",
    confidence: 0.82,
    status: "confirmed",
    scope: ["real_time_systems", "stream_processing", "learning_orchestration"],
    evidence: [
      {
        quote: "실시간 통계 시스템 아키텍처",
        reason: "초기부터 실시간성 자체를 핵심 설계 주제로 다뤘다."
      },
      {
        quote: "RxJS 기반의 스트리밍 처리",
        reason: "상태 변화를 흐름으로 다루는 관심이 반복된다."
      },
      {
        quote: "user learning progression orchestration",
        reason: "학습 진행도 역시 정적 저장보다 오케스트레이션 문제로 본다."
      }
    ]
  }
];

export const systemDecisionRuleSeeds: DecisionRuleSeed[] = [
  {
    summary: "현재값보다 이력과 복구 가능성을 우선한다",
    canonicalText:
      "데이터나 콘텐츠 구조를 다룰 때, 현재 상태를 단순 덮어쓰는 방식보다 이력 보존, 복구 가능성, 발행본과 작업본의 분리처럼 손실을 줄이는 방향을 반복적으로 선호한다.",
    confidence: 0.97,
    status: "confirmed",
    scope: ["data_modeling", "cms_versioning", "user_data_safety"],
    evidence: [
      {
        quote: "non-destructive versioning",
        reason: "콘텐츠 변경을 파괴적으로 덮어쓰지 않겠다는 직접 증거다."
      },
      {
        quote: "soft-delete vs new rows",
        reason: "기존 레코드 수정 대신 이력 보존형 대안을 반복적으로 검토한다."
      },
      {
        quote: "lastPublishVersion",
        reason: "현재본과 발행본을 분리해 관리하려는 판단이 드러난다."
      }
    ]
  },
  {
    summary: "동시성 위험과 중복 실행 비용을 기능보다 먼저 본다",
    canonicalText:
      "멀티 태스크, sync, 진행도 계산, 분산 환경을 설계할 때, 기능 구현 자체보다 race condition, 중복 실행, 락 범위, 재시도 가능성, idempotency를 먼저 점검하는 경향이 있다.",
    confidence: 0.96,
    status: "confirmed",
    scope: ["concurrency", "job_orchestration", "distributed_systems", "backend_architecture"],
    evidence: [
      {
        quote: "distributed locking",
        reason: "동시성 제어를 주변 이슈가 아니라 핵심 설계 축으로 둔다."
      },
      {
        quote: "advisory locks, TTL-based mutex tables",
        reason: "구체적 락 구현 방식을 비교 대상으로 올린다."
      },
      {
        quote: "idempotency keys",
        reason: "재시도와 중복 요청을 설계 단계에서 분리해 다룬다."
      },
      {
        quote: "only one ECS task syncs at a time",
        reason: "병렬성보다 정합성을 우선하는 최종 제약이 명시적이다."
      }
    ]
  },
  {
    summary: "복잡한 일은 구조화 가능한 단위로 쪼개고 포맷화한다",
    canonicalText:
      "기술 설계나 워크플로우를 다룰 때, 복잡한 문제를 감각적으로 처리하기보다 명시적 단위, 템플릿, 계층, diff 목록처럼 구조화 가능한 형태로 바꾸는 경향이 있다.",
    confidence: 0.93,
    status: "confirmed",
    scope: ["workflow_design", "tooling", "backend_architecture", "system_design"],
    evidence: [
      {
        quote: "router, service, schema, and lib",
        reason: "복잡한 서버 로직을 역할 단위로 분리한다."
      },
      {
        quote: "controller-service-factory layering",
        reason: "오케스트레이션도 구조화된 계층으로 분해한다."
      },
      {
        quote: "diff lists (toCreate, toUpdate, toDeactivate)",
        reason: "상태 변경을 명시적 목록으로 분해한다."
      },
      {
        quote: "Zod schemas, generics",
        reason: "입출력 경계와 규칙을 포맷화해 고정한다."
      }
    ]
  },
  {
    summary: "책임 경계와 이름을 먼저 안정화하려 한다",
    canonicalText:
      "구현 전에 어디까지가 어떤 책임인지, 어떤 이름과 계약으로 묶일지를 먼저 정리하려는 경향이 있다. 경계가 흔들리면 이름과 폴더 구조부터 다시 다듬으려는 편이다.",
    confidence: 0.84,
    status: "confirmed",
    scope: ["naming", "code_organization", "api_design", "system_design"],
    evidence: [
      {
        quote: "controller-service-factory layering",
        reason: "역할 분리와 계층 이름을 설계의 핵심으로 둔다."
      },
      {
        quote: "router, service, schema, and lib",
        reason: "폴더와 책임 경계를 명시적으로 고정한다."
      },
      {
        quote: "use the same naming as before",
        reason: "이름 일관성을 일회성 취향이 아니라 반복 요구사항으로 다뤘다."
      },
      {
        quote: "Exact vs Unchecked Prisma types",
        reason: "타입 이름과 경계 차이를 중요한 설계 판단으로 본다."
      }
    ]
  }
];

export const conversationDecisionPlaybookSeeds: DecisionPlaybookSeed[] = [
  {
    domain: "product_scope_for_general_users",
    summary:
      "비전문가 대상 제품을 검토할 때는 사용자의 숙련도를 먼저 보고, 범위를 줄이고, 설치 마찰을 낮추는 형식으로 제품 모양을 바꾸는 절차가 보인다.",
    trigger: "학습 서비스, 도구형 제품, 데모/플레이그라운드, 신규 기능 포지셔닝",
    steps: [
      "대상 사용자가 문외한이어도 되는지 먼저 본다.",
      "전문성 깊이보다 접근성을 우선할지 결정한다.",
      "복잡한 설치나 환경설정을 줄일 방법을 찾는다.",
      "플레이그라운드, 샘플 서비스, 즉시 체험형 전달 방식을 검토한다.",
      "정적 설명보다 상호작용형 경험으로 이해를 돕는다."
    ],
    tradeoffAxes: [
      {
        axis: "전문성 깊이 vs 접근성",
        preferredSide: "접근성",
        reason: "비전문가 진입장벽을 줄이는 질문이 반복된다."
      },
      {
        axis: "설치형 경험 vs 즉시 체험형",
        preferredSide: "즉시 체험형",
        reason: "플레이그라운드와 상호작용형 데모를 더 유력하게 본다."
      }
    ],
    exceptions: [
      "전문가용 내부 도구라면 접근성보다 통제력과 깊이를 우선할 가능성이 있다."
    ],
    confidence: 0.9,
    status: "confirmed",
    evidence: [
      {
        quote: "전문성보다 접근성으로 하는게 나을까?",
        reason: "포지셔닝 판단의 핵심 질문이다."
      },
      {
        quote: "플레이그라운드가 있어야",
        reason: "설치 마찰을 줄이는 방향을 택한다."
      },
      {
        quote: "상호작용이 있는 형태가 좋지?",
        reason: "정적 설명보다 인터랙션을 선호한다."
      }
    ]
  }
];

export const systemDecisionPlaybookSeeds: DecisionPlaybookSeed[] = [
  {
    domain: "cms_versioning_and_sync",
    summary:
      "콘텐츠나 외부 원본과의 동기화 문제에서는 덮어쓰기보다 상태 비교, 버전 생성, 단계적 반영을 우선하는 절차가 보인다.",
    trigger: "LCMS/CMS 동기화, 계층형 콘텐츠 변경, 발행 상태 관리, 복구 가능성이 필요한 데이터 변경",
    steps: [
      "현재 로컬 상태와 원본 상태를 구조 단위로 비교한다.",
      "차이를 toCreate, toUpdate, toDeactivate 같은 diff로 분해한다.",
      "직접 수정할지, 새 버전을 만들지 먼저 판단한다.",
      "발행 상태와 작업 상태를 lastPublishVersion, versionStateCode 등으로 분리 관리한다.",
      "최종 반영은 transactional writes로 감싸 정합성을 닫는다."
    ],
    tradeoffAxes: [
      {
        axis: "간단한 덮어쓰기 vs 이력 보존",
        preferredSide: "이력 보존",
        reason: "non-destructive versioning과 soft-delete 성향이 반복적으로 나타난다."
      },
      {
        axis: "전체 재생성 vs diff 기반 반영",
        preferredSide: "diff 기반 반영",
        reason: "변경을 명시적 차이 목록으로 쪼개는 방식이 일관된다."
      }
    ],
    exceptions: [
      "복구 가치가 매우 낮은 캐시성 데이터라면 더 단순한 재생성도 허용할 가능성이 있다."
    ],
    confidence: 0.96,
    status: "confirmed",
    evidence: [
      {
        quote: "non-destructive versioning",
        reason: "덮어쓰기 회피가 playbook의 중심 원칙이다."
      },
      {
        quote: "diff lists (toCreate, toUpdate, toDeactivate)",
        reason: "실제 반영 절차가 구체적으로 드러난다."
      },
      {
        quote: "transactional writes",
        reason: "적용 마지막 단계가 원자성으로 닫힌다."
      }
    ]
  },
  {
    domain: "concurrency_safe_execution",
    summary:
      "중복 실행이 손상을 만들 수 있는 작업은 먼저 직렬화 필요성을 판단하고, 이후 락 방식과 idempotency를 고르는 절차가 보인다.",
    trigger: "배치, sync, 학습 진행도 계산, 다중 태스크 환경, 분산 작업 스케줄링",
    steps: [
      "같은 작업이 동시에 돌면 어떤 손상이 생기는지 먼저 판단한다.",
      "허용 불가면 advisory lock, mutex table, TTL 같은 제어 수단을 검토한다.",
      "락 범위를 전체 작업 단위로 둘지, 엔터티 단위로 나눌지 정한다.",
      "재시도 가능성을 위해 idempotency key나 중복 감지 로직을 둔다.",
      "트랜잭션 길이와 연결 수를 보고 chunking, proxy, wrapper를 보완 수단으로 붙인다."
    ],
    tradeoffAxes: [
      {
        axis: "최대 병렬성 vs 정합성",
        preferredSide: "정합성",
        reason: "동시 실행 자체를 억제하는 선택이 반복된다."
      },
      {
        axis: "단순 재시도 vs 명시적 idempotency",
        preferredSide: "명시적 idempotency",
        reason: "중복 요청을 운에 맡기지 않고 설계 요소로 다룬다."
      }
    ],
    exceptions: [
      "읽기 전용 계산이나 손상이 작은 캐시 갱신은 더 느슨하게 허용할 수 있다."
    ],
    confidence: 0.95,
    status: "confirmed",
    evidence: [
      {
        quote: "advisory locks, TTL-based mutex tables",
        reason: "중복 실행 제어 수단을 명시적으로 비교했다."
      },
      {
        quote: "idempotency keys",
        reason: "재시도 안전성을 별도 단계로 둔다."
      },
      {
        quote: "only one ECS task syncs at a time",
        reason: "최종 결론이 병렬성 억제임을 보여준다."
      }
    ]
  },
  {
    domain: "backend_module_design",
    summary:
      "서버나 도메인 로직을 설계할 때, 먼저 입력 경계와 책임 분해를 정한 뒤, 타입과 테스트 가능성까지 함께 고정하는 절차가 보인다.",
    trigger: "tRPC API 서버, 복잡한 도메인 서비스, 학습 진행 로직, CMS 관리 서버 설계",
    steps: [
      "입력과 출력 경계를 router와 schema에서 먼저 고정한다.",
      "도메인 오케스트레이션은 service 또는 factory 계층으로 분리한다.",
      "DB 접근은 ORM 계층에 두되 Exact/Unchecked 같은 타입 경계를 의식한다.",
      "반복 유즈케이스는 helper나 actionFactory로 추출한다.",
      "Vitest/E2E 가능성을 고려해 테스트 단위를 미리 나눈다."
    ],
    tradeoffAxes: [
      {
        axis: "빠른 인라인 구현 vs 명시적 계층 분리",
        preferredSide: "명시적 계층 분리",
        reason: "복잡한 유즈케이스일수록 router/service/schema/lib 분리를 유지한다."
      },
      {
        axis: "느슨한 타입 유연성 vs 엄격한 타입 안전성",
        preferredSide: "엄격한 타입 안전성",
        reason: "Zod, generics, Exact/Unchecked를 설계 도구로 쓴다."
      }
    ],
    exceptions: [
      "작은 프로토타입이나 일회성 스크립트에서는 모든 레이어를 동일하게 유지하지 않을 수 있다."
    ],
    confidence: 0.94,
    status: "confirmed",
    evidence: [
      {
        quote: "router, service, schema, and lib",
        reason: "기본 골격이 명시적이다."
      },
      {
        quote: "controller-service-factory layering",
        reason: "오케스트레이션 계층을 따로 두는 패턴을 뒷받침한다."
      },
      {
        quote: "Zod schemas, generics",
        reason: "경계 설계에 타입 도구를 적극 사용한다."
      },
      {
        quote: "Vitest",
        reason: "설계 단계에서 테스트 가능성을 같이 본다."
      }
    ]
  }
];

export const conversationDecisionTraceSeeds: DecisionTraceSeed[] = [
  {
    context: "개인 기반 문서 서비스의 초기 DB 범위를 설계하던 상황",
    decision:
      "협업 기능을 포함한 범용 문서 서비스보다, 협업을 제외한 개인 기반 서비스로 범위를 제한했다.",
    alternatives: [
      "협업 문서 서비스",
      "실시간 동시편집까지 포함한 범위",
      "개인/협업 겸용 구조"
    ],
    reasoning:
      "초기 문제를 축소해 핵심 데이터 모델과 사용자 경험에 집중하려 했다고 볼 수 있다.",
    confidence: 0.9,
    status: "confirmed",
    evidence: [
      {
        quote: "협업 기능이 없는 개인 기반 문서 서비스",
        reason: "범위를 줄이는 직접 선택이다."
      }
    ]
  },
  {
    context: "비전문가도 사용할 수 있는 기술 학습/도구형 제품의 형태를 검토하던 상황",
    decision:
      "설치와 환경설정보다 플레이그라운드와 상호작용형 체험을 우선하는 방향으로 기울었다.",
    alternatives: [
      "설치형 튜토리얼",
      "README 기반 체험",
      "정적 시각화 중심 데모"
    ],
    reasoning:
      "사용자 숙련도를 낮게 가정하고, 이해를 돕는 가장 큰 병목을 설치 마찰로 본 것으로 해석된다.",
    confidence: 0.89,
    status: "confirmed",
    evidence: [
      {
        quote: "플레이그라운드가 있어야",
        reason: "즉시 체험형을 유력 후보로 둔다."
      },
      {
        quote: "상호작용이 있는 형태가 좋지?",
        reason: "정적 데모보다 인터랙션을 택한다."
      }
    ]
  },
  {
    context: "Speaking-Fit류의 음성/학습 기능을 설계하던 시기의 흔적",
    decision:
      "실시간성, 공급자 기능 차이, 비용 모델을 함께 비교하며 STT/평가 방식을 선택하려 했을 가능성이 높다.",
    alternatives: [
      "정확도만 보고 단일 공급자 선택",
      "비용만 보고 저가 서비스 고정",
      "실시간 처리 없이 배치 평가 중심"
    ],
    reasoning:
      "실시간 통계, RxJS 스트리밍, STT 비용 모델링에 대한 관심이 함께 나타나서, 음성 제품에서도 품질과 운영비를 동시에 본 정황이 있다.",
    confidence: 0.62,
    status: "hypothesis",
    evidence: [
      {
        quote: "실시간 통계 시스템 아키텍처",
        reason: "실시간 요구를 제품 수준에서 고민한 흔적이다."
      },
      {
        quote: "RxJS 기반의 스트리밍 처리",
        reason: "음성/실시간 피드백 구조와 연결될 수 있는 기술 관심사다."
      },
      {
        quote: "STT cost modeling with Google STT vs Azure Pronunciation Assessment",
        reason: "공급자 기능과 비용을 함께 본 정황이다."
      }
    ]
  }
];

export const systemDecisionTraceSeeds: DecisionTraceSeed[] = [
  {
    context: "Dumbo의 CMS 콘텐츠 변경 모델을 설계하던 상황",
    decision:
      "기존 콘텐츠를 직접 덮어쓰는 대신 non-destructive versioning을 채택했다.",
    alternatives: [
      "in-place update",
      "전량 재발행 중심 구조",
      "작업본/발행본 구분 없는 단순 테이블"
    ],
    reasoning:
      "이력 추적, 복구 가능성, 발행 상태 관리, 동기화 정합성을 동시에 만족시키려는 선택으로 해석된다.",
    confidence: 0.97,
    status: "confirmed",
    evidence: [
      {
        quote: "non-destructive versioning",
        reason: "결정 자체가 직접 명시된다."
      },
      {
        quote: "lastPublishVersion",
        reason: "발행본 분리 관리가 뒤따르는 구조다."
      }
    ]
  },
  {
    context: "LCMS 데이터를 로컬 DB에 반영하는 sync 파이프라인을 설계하던 상황",
    decision:
      "전량 재생성보다 diff 기반 반영과 transactional writes를 선택했다.",
    alternatives: [
      "전체 테이블 재생성",
      "단순 upsert 일괄 처리",
      "원격 상태 우선 덮어쓰기"
    ],
    reasoning:
      "계층형 콘텐츠와 버전 상태를 유지하면서 정합성을 보장하려면 차이 기반 반영이 더 적합하다고 본 것으로 보인다.",
    confidence: 0.96,
    status: "confirmed",
    evidence: [
      {
        quote: "diff lists (toCreate, toUpdate, toDeactivate)",
        reason: "선택한 반영 전략이 구체적이다."
      },
      {
        quote: "transactional writes",
        reason: "반영 단위를 원자적으로 마무리한다."
      }
    ]
  },
  {
    context: "여러 ECS 태스크가 동시에 sync를 수행할 수 있는 상황을 설계하던 때",
    decision:
      "낙관적 병렬 처리보다 advisory lock이나 TTL 기반 mutex로 단일 실행을 보장하는 방향을 택했다.",
    alternatives: [
      "충돌 후 복구",
      "best-effort 중복 방지",
      "락 없이 최종 일관성에 의존"
    ],
    reasoning:
      "중복 실행 손상이 크다고 보고, 처리량보다 정합성과 안전한 재시도를 우선한 것으로 보인다.",
    confidence: 0.95,
    status: "confirmed",
    evidence: [
      {
        quote: "advisory locks, TTL-based mutex tables",
        reason: "검토한 제어 방식이 명시적이다."
      },
      {
        quote: "only one ECS task syncs at a time",
        reason: "최종적으로 병렬성을 억제했다."
      }
    ]
  },
  {
    context: "Dumbo API 서버의 코드 구조를 정하던 상황",
    decision:
      "라우터에 로직을 몰아넣기보다 router/service/schema/lib 분리와 controller-service-factory 계열 구조를 유지하는 쪽을 택했다.",
    alternatives: [
      "얇은 구조의 인라인 구현",
      "ORM 중심 단일 레이어",
      "경계가 약한 빠른 프로토타입 서버"
    ],
    reasoning:
      "복잡한 도메인 로직과 테스트 가능성을 감당하려면 경계와 책임을 먼저 분리해야 한다고 본 것으로 보인다.",
    confidence: 0.95,
    status: "confirmed",
    evidence: [
      {
        quote: "router, service, schema, and lib",
        reason: "실제 채택된 구조가 드러난다."
      },
      {
        quote: "controller-service-factory layering",
        reason: "세분화된 책임 분리가 추가로 확인된다."
      }
    ]
  }
];

export const decisionValueSeeds: ValueSeed[] = [
  {
    summary: "이력 보존과 복구 가능성을 우선한다",
    canonicalText:
      "데이터 변경은 현재 상태를 덮어쓰는 일보다 나중에 되돌리거나 추적할 수 있게 남겨야 한다고 보는 편이다. 그래서 버전 추가, 발행본/작업본 분리, diff 반영 같은 가역적 구조를 선호한다.",
    confidence: 0.97,
    status: "confirmed",
    scope: ["data_modeling", "cms_versioning", "user_data_safety"],
    derivedFrom: [
      "현재값보다 이력과 복구 가능성을 우선한다"
    ]
  },
  {
    summary: "정합성과 재시도 안전성을 병렬성보다 우선한다",
    canonicalText:
      "중복 실행이 손상을 만들 수 있는 문제에서는 처리량보다 정합성과 재시도 안전성을 먼저 확보해야 한다고 보는 편이다. 락, idempotency, 실행 범위 제한을 설계의 첫 단계로 둔다.",
    confidence: 0.96,
    status: "confirmed",
    scope: ["concurrency", "distributed_systems", "job_orchestration"],
    derivedFrom: [
      "동시성 위험과 중복 실행 비용을 기능보다 먼저 본다"
    ]
  },
  {
    summary: "문제는 먼저 줄인 뒤 푼다",
    canonicalText:
      "모든 가능성을 한 번에 수용하기보다, 지금 꼭 필요한 범위만 남기고 문제를 작게 자르는 편이다. 협업 제외, 특정 워크로드 한정, 검증용/운영용 구분이 자주 그 수단이 된다.",
    confidence: 0.9,
    status: "confirmed",
    scope: ["product_scope", "system_design", "architecture_choice"],
    derivedFrom: [
      "문제 범위를 먼저 줄인 뒤 푼다"
    ]
  },
  {
    summary: "복잡한 문제는 구조화 가능한 형태로 바꾼다",
    canonicalText:
      "복잡한 일을 다룰 때 감각적인 처리보다 계층, 포맷, diff 목록, 타입, 템플릿처럼 구조화 가능한 단위로 바꿔서 다루는 편이다.",
    confidence: 0.93,
    status: "confirmed",
    scope: ["workflow_design", "backend_architecture", "tooling"],
    derivedFrom: [
      "복잡한 일은 구조화 가능한 단위로 쪼개고 포맷화한다"
    ]
  },
  {
    summary: "책임 경계와 이름을 먼저 고정한다",
    canonicalText:
      "구현 세부보다 먼저 어떤 책임이 어디까지인지, 어떤 이름과 계약으로 고정할지를 중요하게 보는 편이다. 경계가 흔들리면 구조와 이름부터 다시 다듬는다.",
    confidence: 0.84,
    status: "confirmed",
    scope: ["naming", "code_organization", "api_design"],
    derivedFrom: [
      "책임 경계와 이름을 먼저 안정화하려 한다"
    ]
  },
  {
    summary: "기술 선택은 운영 현실로 검증한다",
    canonicalText:
      "새 기술을 볼 때 이론적 장점만 보지 않고, 운영비, 전력, 상시 구동 부담, 연결 관리, 배포 마찰 같은 현실 비용으로 먼저 검증하는 편이다.",
    confidence: 0.92,
    status: "confirmed",
    scope: ["infra_cost", "operations", "tool_selection"],
    derivedFrom: [
      "운영비와 유지 부담을 기술 선택의 초기에 계산한다"
    ]
  },
  {
    summary: "시스템을 정적 CRUD보다 흐름과 상태 전이로 본다",
    canonicalText:
      "시스템을 이해할 때 단순 저장소보다 상태 전이, 스트리밍 처리, 실시간 계산 파이프라인처럼 흐름 중심으로 해석하는 편이다.",
    confidence: 0.82,
    status: "confirmed",
    scope: ["real_time_systems", "stream_processing", "learning_orchestration"],
    derivedFrom: [
      "정적 테이블보다 흐름, 상태 전이, 실시간성을 중시한다"
    ]
  }
];

export const decisionSeedOpenQuestions = [
  "Speaking-Fit 설계에 대한 직접 원문은 Dumbo보다 적어서, 음성 제품 관련 규칙은 아직 hypothesis 비중이 남아 있다.",
  "더 과거 데이터 중 일부는 대화 원문이 아니라 요약된 기억 항목이어서, 세부 reasoning 순서를 완전히 복원하기는 어렵다.",
  "문제 범위를 줄이는 성향은 강하지만, 어느 시점에서 다시 범위를 넓혀 복잡도를 받아들이는지가 아직 충분히 드러나지 않았다.",
  "레이어 분리와 이름 일관성 선호는 강하게 보이지만, 작은 프로토타입에서 어디까지 의도적으로 생략하는지는 더 많은 사례가 필요하다.",
  "이력 보존 성향은 매우 강하지만, 캐시나 임시 산출물처럼 파괴적 단순화를 허용하는 명시적 기준은 아직 확정하기 어렵다.",
  "제품 설계와 백엔드 설계에서 동일한 규칙이 반복되는 것은 강한 신호지만, 이것이 모든 개인적 의사결정 영역으로 일반화되는지는 아직 보수적으로 봐야 한다."
] as const;

export const decisionSeedCollections = {
  decisionRules: [
    ...conversationDecisionRuleSeeds,
    ...systemDecisionRuleSeeds
  ],
  decisionPlaybooks: [
    ...conversationDecisionPlaybookSeeds,
    ...systemDecisionPlaybookSeeds
  ],
  decisionTraces: [
    ...conversationDecisionTraceSeeds,
    ...systemDecisionTraceSeeds
  ],
  values: decisionValueSeeds,
  openQuestions: decisionSeedOpenQuestions
};
