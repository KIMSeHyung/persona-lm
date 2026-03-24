import { describe, expect, it } from "vitest";

import { createId } from "../../src/shared/ids";

describe("createId", () => {
  it("keeps the prefix and removes dashes from the generated id", () => {
    const id = createId("mem");

    expect(id).toMatch(/^mem_[0-9a-f]+$/i);
    expect(id.includes("-")).toBe(false);
  });
});
