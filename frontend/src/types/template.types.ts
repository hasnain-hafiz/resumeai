export type TemplateCategory =
  | "MODERN" | "MINIMAL" | "CORPORATE" | "HARVARD" | "STANFORD" | "EXECUTIVE"
  | "ATS_FRIENDLY" | "ACADEMIC" | "ELEGANT" | "COMPACT" | "STUDENT" | "CREATIVE"
  | "GOOGLE" | "APPLE" | "DEVELOPER" | "DARK";

export interface Template {
  id: string;
  key: string;
  name: string;
  category: TemplateCategory;
  atsFriendly: boolean;
}
