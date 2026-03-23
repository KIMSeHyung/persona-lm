import { createPersonaMcpServerDefinition } from "./server.js";

export function createStdioServerPlan() {
  return createPersonaMcpServerDefinition("stdio");
}
