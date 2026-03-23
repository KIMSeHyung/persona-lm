import { messengerMockArtifact } from "../adapters/messenger.mock.js";
import { normalizeMockMessengerArtifact } from "../normalizer/messenger.js";

export function buildMockMessengerEvidence(personaId: string) {
  return normalizeMockMessengerArtifact(messengerMockArtifact, personaId);
}
