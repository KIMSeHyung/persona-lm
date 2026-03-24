export const personaExecutionModes = [
  "dev_feedback",
  "auto",
  "locked"
] as const;

export type PersonaExecutionMode = (typeof personaExecutionModes)[number];

export interface PersonaExecutionPolicy {
  mode: PersonaExecutionMode;
  maxToolRounds: number;
  allowUserFeedback: boolean;
  allowRetryOnLowScore: boolean;
  minFeedbackScoreForAcceptance: number;
  minConfidenceForNoTool: number;
}

/**
 * Resolves the current execution mode into a concrete runtime policy shape.
 */
export function resolvePersonaExecutionPolicy(
  mode: PersonaExecutionMode
): PersonaExecutionPolicy {
  switch (mode) {
    case "dev_feedback":
      return {
        mode,
        maxToolRounds: 2,
        allowUserFeedback: true,
        allowRetryOnLowScore: true,
        minFeedbackScoreForAcceptance: 0.7,
        minConfidenceForNoTool: 0.85
      };
    case "auto":
      return {
        mode,
        maxToolRounds: 1,
        allowUserFeedback: false,
        allowRetryOnLowScore: true,
        minFeedbackScoreForAcceptance: 0.8,
        minConfidenceForNoTool: 0.9
      };
    case "locked":
      return {
        mode,
        maxToolRounds: 0,
        allowUserFeedback: false,
        allowRetryOnLowScore: false,
        minFeedbackScoreForAcceptance: 1,
        minConfidenceForNoTool: 1
      };
  }
}

/**
 * Parses and validates a raw CLI mode string.
 */
export function parsePersonaExecutionMode(
  value: string | undefined
): PersonaExecutionMode {
  const mode = value ?? "auto";

  if (personaExecutionModes.includes(mode as PersonaExecutionMode)) {
    return mode as PersonaExecutionMode;
  }

  throw new Error(
    `Invalid execution mode: ${mode}. Expected one of: ${personaExecutionModes.join(", ")}`
  );
}
