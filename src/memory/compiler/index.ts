import { createMemoryCandidate, promoteCandidateToMemory } from "../models";
import type {
  CompiledMemory,
  MemoryCandidate,
  NormalizedEvidenceUnit
} from "../../shared/types/memory";

export function compileMemoryCandidatesFromEvidence(
  evidenceUnits: NormalizedEvidenceUnit[]
): MemoryCandidate[] {
  const candidates: MemoryCandidate[] = [];

  for (const evidence of evidenceUnits) {
    if (!evidence.authoredBySelf) {
      continue;
    }

    if (evidence.text.includes("오픈소스")) {
      candidates.push(
        createMemoryCandidate({
          personaId: evidence.personaId,
          kind: "preference",
          summary: "제품형 서비스보다 오픈소스 방향에 더 흥미를 보인다",
          canonicalText:
            "새로운 아이디어를 떠올릴 때 제품형 서비스보다 오픈소스 방향에 더 흥미를 느끼는 편이다.",
          confidence: 0.72,
          sourceTypes: [evidence.sourceType],
          evidenceIds: [evidence.id],
          status: "hypothesis",
          stability: "emerging",
          scope: ["project-direction"],
          tags: ["open-source", "product", "preference"]
        })
      );
    }

    if (evidence.text.includes("구조") || evidence.text.includes("통제")) {
      candidates.push(
        createMemoryCandidate({
          personaId: evidence.personaId,
          kind: "decision_rule",
          summary: "프로젝트 설계에서 통제 가능성과 구조적 명확성을 중시한다",
          canonicalText:
            "새 프로젝트를 설계할 때 확장성만 보기보다 구조적 명확성과 통제 가능성을 우선하는 편이다.",
          confidence: 0.77,
          sourceTypes: [evidence.sourceType],
          evidenceIds: [evidence.id],
          status: "hypothesis",
          stability: "emerging",
          scope: ["project-design"],
          tags: ["architecture", "clarity", "control"]
        })
      );
    }

    if (evidence.text.includes("핵심부터") || evidence.text.includes("장황")) {
      candidates.push(
        createMemoryCandidate({
          personaId: evidence.personaId,
          kind: "style_rule",
          summary: "장황한 설명보다 핵심을 먼저 전달하는 편이다",
          canonicalText:
            "설명할 때 장황하게 풀기보다 핵심을 먼저 제시하는 말하기 방식을 선호한다.",
          confidence: 0.81,
          sourceTypes: [evidence.sourceType],
          evidenceIds: [evidence.id],
          status: "confirmed",
          stability: "stable",
          scope: ["conversation"],
          tags: ["style", "concise", "direct"]
        })
      );
    }
  }

  return candidates;
}

export function promoteCandidates(
  candidates: MemoryCandidate[]
): CompiledMemory[] {
  return candidates.map((candidate) =>
    promoteCandidateToMemory({
      candidate,
      validFrom: candidate.createdAt
    })
  );
}
