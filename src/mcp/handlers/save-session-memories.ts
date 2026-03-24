import { saveSessionMemories } from "../../db/session-memories";
import type {
  SaveSessionMemoriesInput,
  SaveSessionMemoriesResult
} from "../tools/contracts";
import type { PersonaMcpHandlerContext } from "./index";

/**
 * Saves session-derived durable memory candidates into the long-term memory store.
 */
export function handleSaveSessionMemories(
  input: SaveSessionMemoriesInput,
  context: PersonaMcpHandlerContext
): SaveSessionMemoriesResult {
  return saveSessionMemories({
    personaId: input.personaId ?? context.defaultPersonaId,
    sessionId: input.sessionId,
    candidates: input.candidates,
    client: context.client
  });
}
