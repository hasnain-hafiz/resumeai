export interface DashboardWelcome {
  fullName: string;
  photoUrl: string | null;
  memberSince: string;
}

export interface DashboardAiUsage {
  used: number;
  monthlyLimit: number;
  remaining: number;
  resetsAt: string;
}

export type ActivityType =
  | "ACCOUNT_CREATED"
  | "PROFILE_UPDATED"
  | "RESUME_CREATED"
  | "COVER_LETTER_CREATED"
  | "ATS_ANALYSIS_RUN"
  | "AI_FEATURE_USED";

export interface DashboardActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  createdAt: string;
}

export interface DashboardProfileCompletion {
  percentage: number;
  missingSteps: string[];
}

export interface DashboardSummary {
  welcome: DashboardWelcome;
  resumeCount: number;
  coverLetterCount: number;
  atsAnalysisCount: number;
  aiUsage: DashboardAiUsage;
  recentActivity: DashboardActivityItem[];
  profileCompletion: DashboardProfileCompletion;
}
