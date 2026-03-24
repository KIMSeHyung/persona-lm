const MEMORY_CONFIDENCE_SCALE = 1000;

/**
 * Converts runtime confidence from 0..1 float space into the stored integer scale.
 */
export function confidenceFloatToStored(confidence: number): number {
  assertFiniteConfidence(confidence);

  const clamped = Math.max(0, Math.min(confidence, 1));
  return Math.round(clamped * MEMORY_CONFIDENCE_SCALE);
}

/**
 * Converts stored confidence from the integer scale back into 0..1 float space.
 */
export function confidenceStoredToFloat(confidence: number): number {
  assertFiniteConfidence(confidence);

  const clamped = Math.max(0, Math.min(confidence, MEMORY_CONFIDENCE_SCALE));
  return clamped / MEMORY_CONFIDENCE_SCALE;
}

/**
 * Rejects NaN and infinity before confidence values are serialized or deserialized.
 */
function assertFiniteConfidence(confidence: number): void {
  if (!Number.isFinite(confidence)) {
    throw new Error(`Confidence must be finite. Received: ${confidence}`);
  }
}
