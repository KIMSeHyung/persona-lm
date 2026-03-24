import { describe, expect, it } from "vitest";

import { messengerMockArtifact } from "../../../src/ingest/adapters/messenger.mock";
import { normalizeMockMessengerArtifact } from "../../../src/ingest/normalizer/messenger";

describe("normalizeMockMessengerArtifact", () => {
  it("preserves messenger artifact metadata in normalized evidence units", () => {
    const evidenceUnits = normalizeMockMessengerArtifact(
      messengerMockArtifact,
      "persona_demo"
    );

    expect(evidenceUnits).toHaveLength(4);
    expect(evidenceUnits[0]).toMatchObject({
      artifactId: messengerMockArtifact.artifactId,
      personaId: "persona_demo",
      sourceType: "messenger",
      channel: "kakao",
      authoredBySelf: true,
      authorLabel: "self",
      roomId: messengerMockArtifact.roomId,
      tags: ["mock", "kakao", "messenger"],
      metadata: {
        sourceMessageId: "msg_1",
        roomTitle: messengerMockArtifact.title
      }
    });
    expect(evidenceUnits[0].id).toMatch(/^ev_/);
    expect(evidenceUnits[1].authoredBySelf).toBe(false);
  });
});
