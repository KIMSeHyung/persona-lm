import { messengerMockArtifact } from "../adapters/messenger.mock";
import { normalizeMockMessengerArtifact } from "../normalizer/messenger";

export function buildMockMessengerEvidence(personaId: string) {
  return normalizeMockMessengerArtifact(messengerMockArtifact, personaId);
}
