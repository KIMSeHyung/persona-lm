import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { applyDatabaseSupportMigrations } from "../db/bootstrap";
import { parsePersonaExecutionMode, type PersonaExecutionMode } from "../runtime/config";
import {
  createPersonaMcpSdkServer,
  createPersonaMcpServerDefinition
} from "./server";

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
  void runStdioServer(parseStdioArgs(process.argv.slice(2))).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

if (isMainModule()) {
  runCli();
}

/**
 * Boots the real SDK-backed stdio MCP server for local integrations.
 */
export async function runStdioServer(
  input: CreateStdioServerPlanInput = {}
): Promise<void> {
  applyDatabaseSupportMigrations();

  const server = createPersonaMcpSdkServer({
    transport: "stdio",
    mode: input.mode ?? "auto"
  });
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

function isMainModule(): boolean {
  const entryPath = process.argv[1];

  if (entryPath === undefined) {
    return false;
  }

  return fileURLToPath(import.meta.url) === path.resolve(entryPath);
}
