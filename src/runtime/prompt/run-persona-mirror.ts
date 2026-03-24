import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import {
  buildPersonaMirrorCodexArgs,
  buildPersonaMirrorSessionPrompt,
  parsePersonaMirrorLauncherArgs
} from "./persona-mirror-launcher";

/**
 * Starts a session-scoped Codex run with persona mirror instructions and MCP overrides injected.
 */
export async function runPersonaMirrorLauncher(args: string[]): Promise<number> {
  const parsed = parsePersonaMirrorLauncherArgs(args);
  const workspaceRoot = path.resolve(parsed.workspaceRoot);
  const personaHome = path.resolve(parsed.personaHome);
  const instructionPath = path.resolve(
    personaHome,
    "src/runtime/prompt/persona-mirror.instructions.md"
  );
  const instructionText = readFileSync(instructionPath, "utf8");
  const prompt = buildPersonaMirrorSessionPrompt({
    instructionText,
    userPrompt: parsed.prompt
  });
  const codexArgs = buildPersonaMirrorCodexArgs({
    workspaceRoot,
    personaHome,
    mode: parsed.mode,
    sandbox: parsed.sandbox,
    prompt
  });

  return await new Promise<number>((resolve, reject) => {
    const child = spawn("codex", codexArgs, {
      cwd: workspaceRoot,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (signal !== null) {
        resolve(1);
        return;
      }

      resolve(code ?? 0);
    });
  });
}

function runCli(): void {
  void runPersonaMirrorLauncher(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}

if (isMainModule()) {
  runCli();
}

function isMainModule(): boolean {
  const entryPath = process.argv[1];

  if (entryPath === undefined) {
    return false;
  }

  return fileURLToPath(import.meta.url) === path.resolve(entryPath);
}
