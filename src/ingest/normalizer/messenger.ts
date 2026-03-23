import { createId } from "../../shared/ids.js";
import type { NormalizedEvidenceUnit } from "../../shared/types/memory.js";
import type { MockMessengerArtifact } from "../adapters/messenger.mock.js";

export function normalizeMockMessengerArtifact(
  artifact: MockMessengerArtifact,
  personaId: string
): NormalizedEvidenceUnit[] {
  return artifact.messages.map((message) => ({
    id: createId("ev"),
    artifactId: artifact.artifactId,
    personaId,
    sourceType: artifact.sourceType,
    channel: artifact.channel,
    authoredBySelf: message.speaker === "self",
    authorLabel: message.speaker,
    text: message.text,
    roomId: artifact.roomId,
    tags: ["mock", artifact.channel, "messenger"],
    createdAt: message.timestamp,
    metadata: {
      sourceMessageId: message.id,
      roomTitle: artifact.title
    }
  }));
}
