import { listEvidenceByIds } from "../../db/evidence";
import { getMemoryById } from "../../db/memories";
import type {
  GetMemoryEvidenceInput,
  GetMemoryEvidenceResult
} from "../tools/contracts";
import type { PersonaMcpHandlerContext } from "./index";

/**
 * Returns evidence rows linked from a compiled memory.
 */
export function handleGetMemoryEvidence(
  input: GetMemoryEvidenceInput,
  context: PersonaMcpHandlerContext
): GetMemoryEvidenceResult {
  const memory = getMemoryById({
    id: input.memoryId,
    client: context.client
  });

  if (memory === null) {
    throw new Error(`Memory not found: ${input.memoryId}`);
  }

  return {
    memoryId: memory.id,
    evidence: listEvidenceByIds({
      ids: memory.evidenceIds,
      client: context.client
    })
  };
}
