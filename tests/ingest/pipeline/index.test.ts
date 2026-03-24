import { describe, expect, it } from "vitest";

import { buildMockMessengerEvidence } from "../../../src/ingest/pipeline/index";

describe("buildMockMessengerEvidence", () => {
  it("builds normalized mock messenger evidence for the requested persona", () => {
    const evidenceUnits = buildMockMessengerEvidence("persona_demo");

    expect(evidenceUnits).toHaveLength(4);
    expect(new Set(evidenceUnits.map((unit) => unit.personaId))).toEqual(
      new Set(["persona_demo"])
    );
    expect(new Set(evidenceUnits.map((unit) => unit.sourceType))).toEqual(
      new Set(["messenger"])
    );
  });
});
