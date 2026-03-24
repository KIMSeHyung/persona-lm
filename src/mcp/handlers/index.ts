import type { PersonaDatabaseClient } from "../../db/client";
import type { PersonaExecutionMode } from "../../runtime/config";

export interface PersonaMcpHandlerContext {
  defaultPersonaId: string;
  mode: PersonaExecutionMode;
  client?: PersonaDatabaseClient;
}
