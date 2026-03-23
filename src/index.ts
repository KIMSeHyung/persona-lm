import { dbPath } from "./db/client.js";
import { buildMockMessengerEvidence } from "./ingest/pipeline/index.js";
import { compileMemoryCandidatesFromEvidence, promoteCandidates } from "./memory/compiler/index.js";
import { createPersonaMcpServerDefinition } from "./mcp/server.js";
import { buildPersonaCore } from "./runtime/context/persona-core.js";
import { formatPersonaContext } from "./runtime/prompt/index.js";
import { retrieveRelevantMemories } from "./runtime/retrieval/index.js";

const personaId = "persona_demo";
const evidenceUnits = buildMockMessengerEvidence(personaId);
const memoryCandidates = compileMemoryCandidatesFromEvidence(evidenceUnits);
const compiledMemories = promoteCandidates(memoryCandidates);
const personaCore = buildPersonaCore(compiledMemories);
const retrieved = retrieveRelevantMemories({
  query: "오픈소스 쪽을 선호하는지와 설명 스타일이 어떤지",
  memories: compiledMemories,
  limit: 3
});
const mcpServer = createPersonaMcpServerDefinition();

console.log("persona-lm scaffold ready");
console.log(`- SQLite database path: ${dbPath}`);
console.log(`- Mock evidence units: ${evidenceUnits.length}`);
console.log(`- Compiled memories: ${compiledMemories.length}`);
console.log(`- MCP tools scaffolded: ${mcpServer.tools.length}`);
console.log("");
console.log(formatPersonaContext(personaCore, retrieved));
