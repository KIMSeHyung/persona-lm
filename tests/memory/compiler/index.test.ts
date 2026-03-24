import { describe, expect, it } from "vitest";

import { buildMockMessengerEvidence } from "../../../src/ingest/pipeline/index";
import {
  compileMemoryCandidatesFromEvidence,
  promoteCandidates
} from "../../../src/memory/compiler/index";
import type { NormalizedEvidenceUnit } from "../../../src/shared/types/memory";

describe("memory compiler", () => {
  it("extracts candidate memories from self-authored mock messenger evidence", () => {
    const candidates = compileMemoryCandidatesFromEvidence(
      buildMockMessengerEvidence("persona_demo")
    );

    expect(candidates).toHaveLength(3);
    expect(candidates.map((candidate) => candidate.kind)).toEqual([
      "preference",
      "decision_rule",
      "style_rule"
    ]);
  });

  it("ignores evidence not authored by the persona even when keywords match", () => {
    const evidenceUnits: NormalizedEvidenceUnit[] = [
      {
        id: "ev_other",
        artifactId: "artifact_1",
        personaId: "persona_demo",
        sourceType: "messenger",
        channel: "kakao",
        authoredBySelf: false,
        authorLabel: "other",
        text: "오픈소스 구조 핵심부터 다 맞는 말이네",
        roomId: "room_1",
        tags: ["mock"],
        createdAt: "2026-03-24T00:00:00.000Z",
        metadata: {}
      }
    ];

    expect(compileMemoryCandidatesFromEvidence(evidenceUnits)).toEqual([]);
  });

  it("promotes candidates into compiled memories with validFrom timestamps", () => {
    const candidates = compileMemoryCandidatesFromEvidence(
      buildMockMessengerEvidence("persona_demo")
    );
    const memories = promoteCandidates(candidates);

    expect(memories).toHaveLength(3);
    expect(memories.every((memory) => memory.validFrom === memory.createdAt)).toBe(true);
    expect(memories.every((memory) => memory.validTo === null)).toBe(true);
  });
});
