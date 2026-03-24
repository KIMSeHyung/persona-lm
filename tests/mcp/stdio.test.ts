import { describe, expect, it } from "vitest";

import {
  createStdioServerPlan,
  parseStdioArgs
} from "../../src/mcp/stdio";

describe("stdio MCP entry point", () => {
  it("parses mode args with and without the pnpm -- separator", () => {
    expect(parseStdioArgs(["--mode", "dev_feedback"])).toEqual({
      mode: "dev_feedback"
    });
    expect(parseStdioArgs(["--", "--mode", "locked"])).toEqual({
      mode: "locked"
    });
  });

  it("builds a stdio server plan with the selected execution mode", () => {
    const plan = createStdioServerPlan({ mode: "locked" });

    expect(plan.transport).toBe("stdio");
    expect(plan.executionMode).toBe("locked");
    expect(plan.executionPolicy.maxToolRounds).toBe(0);
  });
});
