import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { createPersonaMcpServerDefinition } from "./server";
import { parsePersonaExecutionMode, type PersonaExecutionMode } from "../runtime/config";

export interface CreateStdioServerPlanInput {
  mode?: PersonaExecutionMode;
}

/**
 * Builds the current stdio MCP server scaffold with an execution mode attached.
 */
export function createStdioServerPlan(input: CreateStdioServerPlanInput = {}) {
  return createPersonaMcpServerDefinition({
    transport: "stdio",
    mode: input.mode ?? "auto"
  });
}

/**
 * Parses CLI args for the stdio entry point.
 */
export function parseStdioArgs(args: string[]) {
  const normalizedArgs = args[0] === "--" ? args.slice(1) : args;
  const { values } = parseArgs({
    args: normalizedArgs,
    options: {
      mode: {
        type: "string",
        default: "auto"
      }
    }
  });

  return {
    mode: parsePersonaExecutionMode(values.mode)
  };
}

function runCli(): void {
  const { mode } = parseStdioArgs(process.argv.slice(2));
  const plan = createStdioServerPlan({ mode });

  console.log(JSON.stringify(plan, null, 2));
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
