import type { CompiledMemory } from "../../shared/types/memory.js";

export interface PersonaCore {
  styleRules: string[];
  decisionRules: string[];
  values: string[];
  preferences: string[];
  selfDescriptions: string[];
}

export function buildPersonaCore(memories: CompiledMemory[]): PersonaCore {
  return {
    styleRules: pickByKind(memories, "style_rule", 3),
    decisionRules: pickByKind(memories, "decision_rule", 3),
    values: pickByKind(memories, "value", 3),
    preferences: pickByKind(memories, "preference", 3),
    selfDescriptions: pickByKind(memories, "self_description", 2)
  };
}

function pickByKind(
  memories: CompiledMemory[],
  kind: CompiledMemory["kind"],
  limit: number
): string[] {
  return memories
    .filter((memory) => memory.kind === kind)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit)
    .map((memory) => memory.canonicalText);
}
