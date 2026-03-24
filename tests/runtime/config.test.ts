import { describe, expect, it } from "vitest";

import {
  parsePersonaExecutionMode,
  resolvePersonaExecutionPolicy
} from "../../src/runtime/config";

describe("runtime execution config", () => {
  it("resolves execution policies for each mode", () => {
    expect(resolvePersonaExecutionPolicy("dev_feedback")).toMatchObject({
      mode: "dev_feedback",
      maxToolRounds: 2,
      allowUserFeedback: true,
      allowRetryOnLowScore: true,
      minFeedbackScoreForAcceptance: 0.7
    });
    expect(resolvePersonaExecutionPolicy("auto")).toMatchObject({
      mode: "auto",
      maxToolRounds: 1,
      allowUserFeedback: false,
      minFeedbackScoreForAcceptance: 0.8
    });
    expect(resolvePersonaExecutionPolicy("locked")).toMatchObject({
      mode: "locked",
      maxToolRounds: 0,
      allowRetryOnLowScore: false,
      minFeedbackScoreForAcceptance: 1
    });
  });

  it("parses valid execution modes and rejects unknown ones", () => {
    expect(parsePersonaExecutionMode(undefined)).toBe("auto");
    expect(parsePersonaExecutionMode("locked")).toBe("locked");
    expect(() => parsePersonaExecutionMode("unknown")).toThrow("Invalid execution mode");
  });
});
