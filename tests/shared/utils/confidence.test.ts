import { describe, expect, it } from "vitest";

import {
  confidenceFloatToStored,
  confidenceStoredToFloat
} from "../../../src/shared/utils/confidence";

describe("confidence scale conversion", () => {
  it("converts runtime confidence into the stored integer scale", () => {
    expect(confidenceFloatToStored(0.92)).toBe(920);
    expect(confidenceFloatToStored(-1)).toBe(0);
    expect(confidenceFloatToStored(2)).toBe(1000);
  });

  it("converts stored confidence back into runtime float space", () => {
    expect(confidenceStoredToFloat(920)).toBe(0.92);
    expect(confidenceStoredToFloat(-5)).toBe(0);
    expect(confidenceStoredToFloat(2000)).toBe(1);
  });

  it("rejects non-finite confidence values", () => {
    expect(() => confidenceFloatToStored(Number.NaN)).toThrow(
      "Confidence must be finite"
    );
    expect(() => confidenceStoredToFloat(Number.POSITIVE_INFINITY)).toThrow(
      "Confidence must be finite"
    );
  });
});
