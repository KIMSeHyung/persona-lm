import { personaToolNames, type PersonaToolName } from "./tools/contracts";
import {
  resolvePersonaExecutionPolicy,
  type PersonaExecutionMode,
  type PersonaExecutionPolicy
} from "../runtime/config";

export type PersonaMcpTransport = "stdio" | "http";

export interface PersonaMcpToolDefinition {
  name: PersonaToolName;
  description: string;
}

export interface PersonaMcpServerDefinition {
  name: string;
  version: string;
  transport: PersonaMcpTransport;
  executionMode: PersonaExecutionMode;
  executionPolicy: PersonaExecutionPolicy;
  tools: PersonaMcpToolDefinition[];
  resources: string[];
}

export interface CreatePersonaMcpServerDefinitionInput {
  transport?: PersonaMcpTransport;
  mode?: PersonaExecutionMode;
}

export function createPersonaMcpServerDefinition(
  input: CreatePersonaMcpServerDefinitionInput = {}
): PersonaMcpServerDefinition {
  const transport = input.transport ?? "stdio";
  const executionMode = input.mode ?? "auto";

  return {
    name: "persona-lm",
    version: "0.1.0",
    transport,
    executionMode,
    executionPolicy: resolvePersonaExecutionPolicy(executionMode),
    tools: personaToolNames.map((name) => ({
      name,
      description: describeTool(name)
    })),
    resources: [
      "persona://default/core",
      "persona://default/profile",
      "persona://memory/{id}"
    ]
  };
}

function describeTool(name: PersonaToolName): string {
  switch (name) {
    case "search_memories":
      return "Search compiled persona memories relevant to the current query.";
    case "get_memory_evidence":
      return "Return supporting evidence rows for a memory.";
    case "get_persona_core":
      return "Return the compact core persona context.";
    case "get_session_summary":
      return "Return the current session summary.";
    case "submit_feedback":
      return "Store user feedback for a run and report whether the feedback pipeline triggered a retry.";
  }
}
