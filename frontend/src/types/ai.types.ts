export type CareerLevel = "STUDENT" | "FRESHER" | "JUNIOR" | "MID_LEVEL" | "SENIOR" | "ARCHITECT";

export const CAREER_LEVEL_LABELS: Record<CareerLevel, string> = {
  STUDENT: "Student",
  FRESHER: "Fresher",
  JUNIOR: "Junior professional",
  MID_LEVEL: "Mid-level professional",
  SENIOR: "Senior professional",
  ARCHITECT: "Architect / principal",
};

export interface GenerateSummaryRequest {
  careerLevel: CareerLevel;
  targetRole?: string;
  additionalContext?: string;
}

export interface GenerateSummaryResponse {
  summary: string;
  aiUsageRemaining: number;
}
