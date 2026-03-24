import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPersonaMirrorLauncher } from "./runtime/prompt/run-persona-mirror";

export interface PersonalmCliArgs {
  command: "mirror";
  forwardedArgs: string[];
}

/**
 * Parses the top-level personalm CLI arguments and routes them to a supported subcommand.
 */
export function parsePersonalmCliArgs(args: string[]): PersonalmCliArgs {
  const [firstArg, ...restArgs] = args;

  if (firstArg === undefined) {
    return {
      command: "mirror",
      forwardedArgs: []
    };
  }

  if (firstArg === "mirror") {
    return {
      command: "mirror",
      forwardedArgs: restArgs
    };
  }

  if (firstArg.startsWith("-")) {
    return {
      command: "mirror",
      forwardedArgs: args
    };
  }

  throw new Error(
    `Unsupported personalm command "${firstArg}". Currently supported: mirror.`
  );
}

/**
 * Runs the top-level personalm CLI.
 */
export async function runPersonalmCli(args: string[]): Promise<number> {
  const parsed = parsePersonalmCliArgs(args);

  switch (parsed.command) {
    case "mirror":
      return await runPersonaMirrorLauncher(parsed.forwardedArgs);
  }
}

function runCli(): void {
  void runPersonalmCli(process.argv.slice(2))
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
