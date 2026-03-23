import { personaToolNames, type PersonaToolName } from "./tools/contracts.js";

export type PersonaMcpTransport = "stdio" | "http";

export interface PersonaMcpToolDefinition {
  name: PersonaToolName;
  description: string;
}

export interface PersonaMcpServerDefinition {
  name: string;
  version: string;
  transport: PersonaMcpTransport;
  tools: PersonaMcpToolDefinition[];
  resources: string[];
}

export function createPersonaMcpServerDefinition(
  transport: PersonaMcpTransport = "stdio"
): PersonaMcpServerDefinition {
  return {
    name: "persona-lm",
    version: "0.1.0",
    transport,
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
  }
}
