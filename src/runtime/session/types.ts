export interface SessionSummary {
  sessionId: string;
  personaId: string;
  currentGoal: string | null;
  activeTopics: string[];
  recentCommitments: string[];
  updatedAt: string;
}
