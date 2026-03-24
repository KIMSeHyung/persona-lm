import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildPersonaMirrorCodexArgs,
  buildPersonaMirrorSessionPrompt,
  parsePersonaMirrorLauncherArgs
} from "../../../src/runtime/prompt/persona-mirror-launcher";

describe("persona mirror launcher helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses mode, sandbox, and trailing prompt text", () => {
    vi.stubEnv("PERSONALM_HOME", "/repo/persona-lm");

    expect(
      parsePersonaMirrorLauncherArgs([
        "-C",
        "/repo/workspace",
        "--mode",
        "dev_feedback",
        "--sandbox",
        "read-only",
        "첫 번째",
        "질문"
      ])
    ).toEqual({
      workspaceRoot: "/repo/workspace",
      personaHome: "/repo/persona-lm",
      mode: "dev_feedback",
      sandbox: "read-only",
      prompt: "첫 번째 질문"
    });
  });

  it("uses PERSONALM_HOME as persona backend when -C is omitted", () => {
    vi.stubEnv("PERSONALM_HOME", "/env/persona-lm");

    expect(parsePersonaMirrorLauncherArgs(["--mode", "locked", "질문"])).toEqual({
      workspaceRoot: process.cwd(),
      personaHome: "/env/persona-lm",
      mode: "locked",
      sandbox: "workspace-write",
      prompt: "질문"
    });
  });

  it("falls back to the current shell cwd when PERSONALM_HOME is absent", () => {
    expect(parsePersonaMirrorLauncherArgs(["-C", "/workspace/app", "질문"])).toEqual({
      workspaceRoot: "/workspace/app",
      personaHome: process.cwd(),
      mode: "locked",
      sandbox: "workspace-write",
      prompt: "질문"
    });
  });

  it("keeps -C as the workspace root even when PERSONALM_HOME exists", () => {
    vi.stubEnv("PERSONALM_HOME", "/env/persona-lm");

    expect(parsePersonaMirrorLauncherArgs(["-C", "/workspace/app", "질문"])).toEqual({
      workspaceRoot: "/workspace/app",
      personaHome: "/env/persona-lm",
      mode: "locked",
      sandbox: "workspace-write",
      prompt: "질문"
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
      workspaceRoot: "/repo/workspace",
      personaHome: "/repo/persona-lm",
      mode: "locked",
      sandbox: "workspace-write",
      prompt: "질문"
    });

    expect(args).toEqual([
      "-C",
      "/repo/workspace",
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
