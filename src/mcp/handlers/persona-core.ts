import { listMemoriesForPersona } from "../../db/memories";
import { buildPersonaCore } from "../../runtime/context/persona-core";
import type { GetPersonaCoreInput, GetPersonaCoreResult } from "../tools/contracts";
import type { PersonaMcpHandlerContext } from "./index";

/**
 * Builds the compact persona core from current long-term memories.
 */
export function handleGetPersonaCore(
  input: GetPersonaCoreInput,
  context: PersonaMcpHandlerContext
): GetPersonaCoreResult {
  const personaId = input.personaId ?? context.defaultPersonaId;
  const memories = listMemoriesForPersona({
    personaId,
    client: context.client
  });

  return {
    personaId,
    ...buildPersonaCore(memories)
  };
}
