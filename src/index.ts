import { dbPath } from "./db/client";
import { buildMockMessengerEvidence } from "./ingest/pipeline/index";
import { compileMemoryCandidatesFromEvidence, promoteCandidates } from "./memory/compiler/index";
import { createPersonaMcpServerDefinition } from "./mcp/server";
import { buildPersonaCore } from "./runtime/context/persona-core";
import { formatPersonaContext } from "./runtime/prompt/index";
import { retrieveRelevantMemories } from "./runtime/retrieval/index";
import {
  buildDecisionSeedMemories,
  decisionSeedOpenQuestions
} from "./seeds/persona/decision-seed";

const personaId = "persona_demo";
const evidenceUnits = buildMockMessengerEvidence(personaId);
const memoryCandidates = compileMemoryCandidatesFromEvidence(evidenceUnits);
const decisionSeedMemories = buildDecisionSeedMemories(personaId);
const compiledMemories = [
  ...promoteCandidates(memoryCandidates),
  ...decisionSeedMemories
];
const personaCore = buildPersonaCore(compiledMemories);
const styleRetrieved = retrieveRelevantMemories({
  query: "오픈소스 쪽을 선호하는지와 설명 스타일이 어떤지",
  memories: compiledMemories,
  limit: 3
});
const decisionRetrieved = retrieveRelevantMemories({
  query: "콘텐츠 버전 관리와 동시성 제어를 어떻게 판단하는 편인지",
  memories: compiledMemories,
  limit: 5
});
const mcpServer = createPersonaMcpServerDefinition();

console.log("persona-lm scaffold ready");
console.log(`- SQLite database path: ${dbPath}`);
console.log(`- Mock evidence units: ${evidenceUnits.length}`);
console.log(`- Compiled memories: ${compiledMemories.length}`);
console.log(`- Decision seed memories: ${decisionSeedMemories.length}`);
console.log(`- MCP tools scaffolded: ${mcpServer.tools.length}`);
console.log(`- Open decision questions tracked: ${decisionSeedOpenQuestions.length}`);
console.log("");
console.log("[style-demo]");
console.log(formatPersonaContext(personaCore, styleRetrieved));
console.log("");
console.log("[decision-demo]");
console.log(formatPersonaContext(personaCore, decisionRetrieved));
