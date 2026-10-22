export type AbilityLevel = "recall" | "understand" | "transfer";

export type ModuleKnowledge = {
  id: string; title: string; subtitle: string; weight: number; objective: string;
  conclusion: string; anchor: string; requiredPoints: string[];
  keywords: string[][]; misconceptions: string[]; boundary: string; review: string;
};

export type AssessmentItem = {
  id: string; moduleId: string; level: AbilityLevel; prompt: string; followUp: string;
  reference: string; requiredPointIndexes: number[];
};

export type ScoreResult = {
  itemId: string; moduleId: string; total: number; pointCoverage: number;
  pointScores: Array<{ point: string; score: number; maxScore: number; evidence: string }>;
  hitPoints: string[]; missingPoints: string[]; errorStatements: string[]; blockers: string[];
  evidence: string[]; tags: string[];
  feedback: { correct: string; gap: string; next: string };
  followUpNeeded: boolean; followUp: string; mode: "ai" | "rules";
};
