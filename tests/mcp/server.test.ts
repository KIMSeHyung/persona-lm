import { describe, expect, it } from "vitest";

import { createPersonaMcpServerDefinition } from "../../src/mcp/server";

describe("createPersonaMcpServerDefinition", () => {
  it("creates the default stdio server definition in auto mode", () => {
    const server = createPersonaMcpServerDefinition();

    expect(server.transport).toBe("stdio");
    expect(server.executionMode).toBe("auto");
    expect(server.executionPolicy.maxToolRounds).toBe(1);
    expect(server.tools.map((tool) => tool.name)).toEqual([
      "search_memories",
      "get_decision_context",
      "get_memory_evidence",
      "get_persona_core",
      "get_session_summary",
      "save_session_memories",
      "submit_feedback"
    ]);
    expect(
      server.tools.find((tool) => tool.name === "save_session_memories")?.description
    ).toContain("conversation unit");
  });

  it("allows overriding transport and execution mode", () => {
    const server = createPersonaMcpServerDefinition({
      transport: "http",
      mode: "locked"
    });

    expect(server.transport).toBe("http");
    expect(server.executionMode).toBe("locked");
    expect(server.executionPolicy.maxToolRounds).toBe(0);
  });
});
