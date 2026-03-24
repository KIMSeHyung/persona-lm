import { listMemoriesForPersona } from "../../db/memories";
import type { PersonaDatabaseClient } from "../../db/client";
import { retrieveRelevantMemoriesFromStore } from "../retrieval/index";
import type {
  CompiledMemory,
  RetrievedMemory
} from "../../shared/types/memory";
import { buildPersonaCore, type PersonaCore } from "./persona-core";

const decisionContextKindWeights = {
  decision_playbook: 0.55,
  decision_rule: 0.35,
  decision_trace: 0.15,
  value: 0.2
} as const;

const decisionContextLimits = {
  playbooks: 2,
  rules: 3,
  traces: 2,
  values: 2
} as const;

type DecisionRetrievedKind =
  | "decision_playbook"
  | "decision_rule"
  | "decision_trace"
  | "value";

export interface DecisionContextMemory {
  memoryId: string;
  summary: string;
  canonicalText: string;
  score: number;
  confidence: number;
  matchedTerms: string[];
}

export interface DecisionContextRule extends DecisionContextMemory {}

export interface DecisionContextPlaybook extends DecisionContextMemory {
  trigger: string | null;
  steps: string[];
  exceptions: string[];
  tradeoffAxes: Array<{
    axis: string;
    preferredSide: string;
    reason: string;
  }>;
}

export interface DecisionContextTrace extends DecisionContextMemory {
  decision: string | null;
  reasoning: string | null;
  alternatives: string[];
}

export interface DecisionContextValue extends DecisionContextMemory {}

export interface DecisionContext extends Record<string, unknown> {
  personaId: string;
  query: string;
  personaCore: PersonaCore;
  playbooks: DecisionContextPlaybook[];
  rules: DecisionContextRule[];
  traces: DecisionContextTrace[];
  values: DecisionContextValue[];
  usedMemoryIds: string[];
}

export interface BuildDecisionContextFromStoreInput {
  personaId: string;
  query: string;
  client?: PersonaDatabaseClient;
}

/**
 * Builds a single decision-oriented context bundle from long-term memory for host/model consumption.
 */
export function buildDecisionContextFromStore(
  input: BuildDecisionContextFromStoreInput
): DecisionContext {
  const allMemories = listMemoriesForPersona({
    personaId: input.personaId,
    limit: 500,
    client: input.client
  });
  const retrieved = retrieveRelevantMemoriesFromStore({
    personaId: input.personaId,
    query: input.query,
    kinds: ["decision_playbook", "decision_rule", "decision_trace", "value"],
    limit: 12,
    candidateLimit: 24,
    kindWeights: decisionContextKindWeights,
    client: input.client
  });
  const selected = selectDecisionMemories(allMemories, retrieved);

  return {
    personaId: input.personaId,
    query: input.query,
    personaCore: buildPersonaCore(allMemories),
    playbooks: selected.playbooks.map((item) => mapPlaybook(item)),
    rules: selected.rules.map((item) => mapRule(item)),
    traces: selected.traces.map((item) => mapTrace(item)),
    values: selected.values.map((item) => mapValue(item)),
    usedMemoryIds: [
      ...new Set([
        ...selected.playbooks,
        ...selected.rules,
        ...selected.traces,
        ...selected.values
      ].map((item) => item.memory.id))
    ]
  };
}

function selectDecisionMemories(
  allMemories: CompiledMemory[],
  retrieved: RetrievedMemory[]
) {
  const playbooks = takeRetrievedByKind(
    retrieved,
    "decision_playbook",
    decisionContextLimits.playbooks
  );
  const rules = ensureAtLeastOne(
    takeRetrievedByKind(retrieved, "decision_rule", decisionContextLimits.rules),
    allMemories,
    "decision_rule"
  );
  const traces = takeRetrievedByKind(
    retrieved,
    "decision_trace",
    decisionContextLimits.traces
  );
  const values = ensureAtLeastOne(
    takeRetrievedByKind(retrieved, "value", decisionContextLimits.values),
    allMemories,
    "value"
  );

  return {
    playbooks: ensureAtLeastOne(playbooks, allMemories, "decision_playbook"),
    rules,
    traces,
    values
  };
}

function takeRetrievedByKind(
  retrieved: RetrievedMemory[],
  kind: DecisionRetrievedKind,
  limit: number
): RetrievedMemory[] {
  return retrieved.filter((item) => item.memory.kind === kind).slice(0, limit);
}

function ensureAtLeastOne(
  items: RetrievedMemory[],
  allMemories: CompiledMemory[],
  kind: DecisionRetrievedKind
): RetrievedMemory[] {
  if (items.length > 0) {
    return items;
  }

  const fallback = allMemories
    .filter((memory) => memory.kind === kind)
    .sort((a, b) => b.confidence - a.confidence)[0];

  if (fallback === undefined) {
    return items;
  }

  return [
    {
      memory: fallback,
      score: fallback.confidence,
      matchedTerms: []
    }
  ];
}

function mapRule(item: RetrievedMemory): DecisionContextRule {
  return mapBaseDecisionMemory(item);
}

function mapPlaybook(item: RetrievedMemory): DecisionContextPlaybook {
  const metadata = item.memory.metadata;

  return {
    ...mapBaseDecisionMemory(item),
    trigger: readString(metadata.trigger),
    steps: readStringArray(metadata.steps),
    exceptions: readStringArray(metadata.exceptions),
    tradeoffAxes: readTradeoffAxes(metadata.tradeoffAxes)
  };
}

function mapTrace(item: RetrievedMemory): DecisionContextTrace {
  const metadata = item.memory.metadata;

  return {
    ...mapBaseDecisionMemory(item),
    decision: readString(metadata.decision),
    reasoning: readString(metadata.reasoning),
    alternatives: readStringArray(metadata.alternatives)
  };
}

function mapValue(item: RetrievedMemory): DecisionContextValue {
  return mapBaseDecisionMemory(item);
}

function mapBaseDecisionMemory(item: RetrievedMemory): DecisionContextMemory {
  return {
    memoryId: item.memory.id,
    summary: item.memory.summary,
    canonicalText: item.memory.canonicalText,
    score: item.score,
    confidence: item.memory.confidence,
    matchedTerms: item.matchedTerms
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function readTradeoffAxes(
  value: unknown
): Array<{
  axis: string;
  preferredSide: string;
  reason: string;
}> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }

    const axis = readString((item as Record<string, unknown>).axis);
    const preferredSide = readString(
      (item as Record<string, unknown>).preferredSide
    );
    const reason = readString((item as Record<string, unknown>).reason);

    if (axis === null || preferredSide === null || reason === null) {
      return [];
    }

    return [
      {
        axis,
        preferredSide,
        reason
      }
    ];
  });
}
