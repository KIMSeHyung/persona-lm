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
      allowRetryOnLowScore: true
    });
    expect(resolvePersonaExecutionPolicy("auto")).toMatchObject({
      mode: "auto",
      maxToolRounds: 1,
      allowUserFeedback: false
    });
    expect(resolvePersonaExecutionPolicy("locked")).toMatchObject({
      mode: "locked",
      maxToolRounds: 0,
      allowRetryOnLowScore: false
    });
  });

  it("parses valid execution modes and rejects unknown ones", () => {
    expect(parsePersonaExecutionMode(undefined)).toBe("auto");
    expect(parsePersonaExecutionMode("locked")).toBe("locked");
    expect(() => parsePersonaExecutionMode("unknown")).toThrow("Invalid execution mode");
  });
});
