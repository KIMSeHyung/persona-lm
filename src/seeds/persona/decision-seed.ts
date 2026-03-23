import { createHash } from "node:crypto";

import { createCompiledMemory } from "../../memory/models.js";
import type { CompiledMemory } from "../../shared/types/memory.js";
import {
  conversationDecisionPlaybookSeeds,
  conversationDecisionRuleSeeds,
  conversationDecisionTraceSeeds,
  decisionSeedOpenQuestions,
  decisionSeedSourceType,
  decisionSeedTimestamp,
  decisionValueSeeds,
  systemDecisionPlaybookSeeds,
  systemDecisionRuleSeeds,
  systemDecisionTraceSeeds
} from "./decision-seed.data.js";
import type {
  DecisionPlaybookSeed,
  DecisionRuleSeed,
  DecisionTraceSeed,
  ValueSeed
} from "./decision-seed.data.js";

export { decisionSeedOpenQuestions } from "./decision-seed.data.js";

export function buildDecisionSeedMemories(personaId: string): CompiledMemory[] {
  return [
    ...conversationDecisionRuleSeeds.map((seed) =>
      buildDecisionRuleMemory(personaId, seed)
    ),
    ...systemDecisionRuleSeeds.map((seed) => buildDecisionRuleMemory(personaId, seed)),
    ...conversationDecisionPlaybookSeeds.map((seed) =>
      buildDecisionPlaybookMemory(personaId, seed)
    ),
    ...systemDecisionPlaybookSeeds.map((seed) =>
      buildDecisionPlaybookMemory(personaId, seed)
    ),
    ...conversationDecisionTraceSeeds.map((seed) =>
      buildDecisionTraceMemory(personaId, seed)
    ),
    ...systemDecisionTraceSeeds.map((seed) => buildDecisionTraceMemory(personaId, seed)),
    ...decisionValueSeeds.map((seed) => buildValueMemory(personaId, seed))
  ];
}

function buildDecisionRuleMemory(
  personaId: string,
  seed: DecisionRuleSeed
): CompiledMemory {
  return createCompiledMemory({
    id: createSeedId("mem", seed.summary),
    personaId,
    kind: "decision_rule",
    summary: seed.summary,
    canonicalText: seed.canonicalText,
    status: seed.status,
    confidence: seed.confidence,
    stability: "stable",
    scope: seed.scope,
    tags: seed.scope,
    sourceTypes: [decisionSeedSourceType],
    metadata: {
      evidence: seed.evidence,
      seedType: "decision_rule"
    },
    createdAt: decisionSeedTimestamp,
    updatedAt: decisionSeedTimestamp,
    validFrom: decisionSeedTimestamp,
    validTo: null
  });
}

function buildDecisionPlaybookMemory(
  personaId: string,
  seed: DecisionPlaybookSeed
): CompiledMemory {
  return createCompiledMemory({
    id: createSeedId("mem", seed.domain),
    personaId,
    kind: "decision_playbook",
    summary: seed.summary,
    canonicalText: buildPlaybookCanonicalText(seed),
    status: seed.status,
    confidence: seed.confidence,
    stability: seed.status === "hypothesis" ? "emerging" : "stable",
    scope: [seed.domain],
    tags: [seed.domain, "decision_playbook"],
    sourceTypes: [decisionSeedSourceType],
    metadata: {
      trigger: seed.trigger,
      steps: seed.steps,
      tradeoffAxes: seed.tradeoffAxes,
      exceptions: seed.exceptions,
      evidence: seed.evidence,
      seedType: "decision_playbook"
    },
    createdAt: decisionSeedTimestamp,
    updatedAt: decisionSeedTimestamp,
    validFrom: decisionSeedTimestamp,
    validTo: null
  });
}

function buildDecisionTraceMemory(
  personaId: string,
  seed: DecisionTraceSeed
): CompiledMemory {
  return createCompiledMemory({
    id: createSeedId("mem", seed.context),
    personaId,
    kind: "decision_trace",
    summary: seed.context,
    canonicalText: `${seed.context}에서는 ${seed.decision} 이유: ${seed.reasoning}`,
    status: seed.status,
    confidence: seed.confidence,
    stability: "volatile",
    scope: ["decision_trace"],
    tags: ["decision_trace"],
    sourceTypes: [decisionSeedSourceType],
    metadata: {
      decision: seed.decision,
      alternatives: seed.alternatives,
      reasoning: seed.reasoning,
      evidence: seed.evidence,
      seedType: "decision_trace"
    },
    createdAt: decisionSeedTimestamp,
    updatedAt: decisionSeedTimestamp,
    validFrom: decisionSeedTimestamp,
    validTo: null
  });
}

function buildValueMemory(personaId: string, seed: ValueSeed): CompiledMemory {
  return createCompiledMemory({
    id: createSeedId("mem", seed.summary),
    personaId,
    kind: "value",
    summary: seed.summary,
    canonicalText: seed.canonicalText,
    status: seed.status,
    confidence: seed.confidence,
    stability: "stable",
    scope: seed.scope,
    tags: seed.scope,
    sourceTypes: [decisionSeedSourceType],
    metadata: {
      derivedFrom: seed.derivedFrom,
      seedType: "value"
    },
    createdAt: decisionSeedTimestamp,
    updatedAt: decisionSeedTimestamp,
    validFrom: decisionSeedTimestamp,
    validTo: null
  });
}

function buildPlaybookCanonicalText(seed: DecisionPlaybookSeed): string {
  return `${seed.summary} 판단 절차: ${seed.steps.join(" -> ")}`;
}

function createSeedId(prefix: string, label: string): string {
  const hash = createHash("sha1").update(label).digest("hex").slice(0, 16);
  return `${prefix}_${hash}`;
}
