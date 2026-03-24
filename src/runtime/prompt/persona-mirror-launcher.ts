import { parseArgs } from "node:util";

export type PersonaMirrorSandboxMode =
  | "read-only"
  | "workspace-write"
  | "danger-full-access";

export interface PersonaMirrorLauncherArgs {
  workspaceRoot: string;
  personaHome: string;
  mode: "dev_feedback" | "auto" | "locked";
  sandbox: PersonaMirrorSandboxMode;
  prompt: string;
}

export interface BuildPersonaMirrorSessionPromptInput {
  instructionText: string;
  userPrompt: string;
}

export interface BuildPersonaMirrorCodexArgsInput {
  workspaceRoot: string;
  personaHome: string;
  mode: PersonaMirrorLauncherArgs["mode"];
  sandbox: PersonaMirrorLauncherArgs["sandbox"];
  prompt: string;
}

/**
 * Resolves the persona backend root from environment, falling back to the current shell cwd.
 */
export function resolvePersonaMirrorHome(): string {
  return process.env.PERSONALM_HOME ?? process.cwd();
}

/**
 * Parses CLI args for the session-limited persona mirror launcher.
 */
export function parsePersonaMirrorLauncherArgs(
  args: string[]
): PersonaMirrorLauncherArgs {
  const normalizedArgs = args[0] === "--" ? args.slice(1) : args;
  const { values, positionals } = parseArgs({
    args: normalizedArgs,
    options: {
      cwd: {
        type: "string",
        short: "C",
        default: process.cwd()
      },
      mode: {
        type: "string",
        default: "locked"
      },
      sandbox: {
        type: "string",
        default: "workspace-write"
      }
    },
    allowPositionals: true
  });
  const prompt = positionals.join(" ").trim();

  return {
    workspaceRoot: values.cwd,
    personaHome: resolvePersonaMirrorHome(),
    mode: parseMode(values.mode),
    sandbox: parseSandbox(values.sandbox),
    prompt
  };
}

/**
 * Builds the initial Codex prompt that injects persona instructions without mutating global config.
 */
export function buildPersonaMirrorSessionPrompt(
  input: BuildPersonaMirrorSessionPromptInput
): string {
  const instruction = input.instructionText.trim();
  const userPrompt = input.userPrompt.trim();

  if (userPrompt.length === 0) {
    return `${instruction}\n\n위 instruction을 이번 세션 전체에 적용하고, 그 내용을 반복 설명하지 말고 다음 사용자 요청을 기다린다.`;
  }

  return `${instruction}\n\n아래는 이번 세션의 실제 사용자 요청이다.\n\n${userPrompt}`;
}

/**
 * Builds a one-shot Codex invocation with session-scoped MCP overrides for persona mirror testing.
 */
export function buildPersonaMirrorCodexArgs(
  input: BuildPersonaMirrorCodexArgsInput
): string[] {
  return [
    "-C",
    input.workspaceRoot,
    "-s",
    input.sandbox,
    "-c",
    'mcp_servers.persona_lm.command="node"',
    "-c",
    `mcp_servers.persona_lm.args=["--import","tsx","src/mcp/stdio.ts","--mode","${input.mode}"]`,
    "-c",
    `mcp_servers.persona_lm.cwd="${input.personaHome}"`,
    input.prompt
  ];
}

function parseMode(value: string): PersonaMirrorLauncherArgs["mode"] {
  if (value === "dev_feedback" || value === "auto" || value === "locked") {
    return value;
  }

  throw new Error(
    `Unsupported mode "${value}". Expected one of: dev_feedback, auto, locked.`
  );
}

function parseSandbox(value: string): PersonaMirrorSandboxMode {
  if (
    value === "read-only" ||
    value === "workspace-write" ||
    value === "danger-full-access"
  ) {
    return value;
  }

  throw new Error(
    `Unsupported sandbox "${value}". Expected one of: read-only, workspace-write, danger-full-access.`
  );
}
