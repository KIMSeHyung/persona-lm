import type { PersonaCore } from "../context/persona-core";
import type { RetrievedMemory } from "../../shared/types/memory";

export function formatPersonaContext(
  core: PersonaCore,
  retrievedMemories: RetrievedMemory[]
): string {
  const lines: string[] = [];

  lines.push("[persona-core]");
  lines.push(...renderSection("style", core.styleRules));
  lines.push(...renderSection("decision", core.decisionRules));
  lines.push(...renderSection("value", core.values));
  lines.push(...renderSection("preference", core.preferences));
  lines.push(...renderSection("self", core.selfDescriptions));

  lines.push("");
  lines.push("[retrieved-memories]");

  for (const item of retrievedMemories) {
    lines.push(`- (${item.memory.kind}) ${item.memory.canonicalText}`);
  }

  return lines.join("\n");
}

function renderSection(label: string, values: string[]): string[] {
  if (values.length === 0) {
    return [];
  }

  return values.map((value) => `- ${label}: ${value}`);
}
