import { describe, expect, it } from "vitest";

import {
  buildPersonaMirrorCodexArgs,
  buildPersonaMirrorSessionPrompt,
  parsePersonaMirrorLauncherArgs
} from "../../../src/runtime/prompt/persona-mirror-launcher";

describe("persona mirror launcher helpers", () => {
  it("parses mode, sandbox, and trailing prompt text", () => {
    expect(
      parsePersonaMirrorLauncherArgs([
        "--mode",
        "dev_feedback",
        "--sandbox",
        "read-only",
        "첫 번째",
        "질문"
      ])
    ).toEqual({
      mode: "dev_feedback",
      sandbox: "read-only",
      prompt: "첫 번째 질문"
    });
  });

  it("builds a session prompt from instruction text and user prompt", () => {
    const prompt = buildPersonaMirrorSessionPrompt({
      instructionText: "# Instruction\n\nmirror mode",
      userPrompt: "의사결정 성향을 말해줘"
    });

    expect(prompt).toContain("# Instruction");
    expect(prompt).toContain("의사결정 성향을 말해줘");
    expect(prompt).toContain("아래는 이번 세션의 실제 사용자 요청이다.");
  });

  it("builds session-only codex args with MCP overrides", () => {
    const args = buildPersonaMirrorCodexArgs({
      repoRoot: "/repo/persona-lm",
      mode: "locked",
      sandbox: "workspace-write",
      prompt: "질문"
    });

    expect(args).toEqual([
      "-C",
      "/repo/persona-lm",
      "-s",
      "workspace-write",
      "-c",
      'mcp_servers.persona_lm.command="node"',
      "-c",
      'mcp_servers.persona_lm.args=["--import","tsx","src/mcp/stdio.ts","--mode","locked"]',
      "-c",
      'mcp_servers.persona_lm.cwd="/repo/persona-lm"',
      "질문"
    ]);
  });
});
