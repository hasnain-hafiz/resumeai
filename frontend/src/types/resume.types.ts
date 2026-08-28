import type { Template } from "@/types/template.types";

export interface ResumeSummary {
  id: string;
  title: string;
  fullName: string | null;
  photoUrl: string | null;
  templateKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE" | "INTERNSHIP" | "VOLUNTEER";

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string | null;
  employmentType: EmploymentType | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  responsibilities: string | null;
  achievements: string | null;
  sortOrder: number;
}

export interface Education {
  id: string;
  school: string;
  degree: string | null;
  field: string | null;
  cgpa: number | null;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
}

export interface ProjectImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  technologies: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  sortOrder: number;
  images: ProjectImage[];
}

export type ListItemSection =
  | "TECHNICAL_SKILL"
  | "SOFT_SKILL"
  | "TOOL"
  | "FRAMEWORK"
  | "DATABASE"
  | "PROGRAMMING_LANGUAGE"
  | "INTEREST"
  | "SPOKEN_LANGUAGE";

export type Proficiency = "BASIC" | "CONVERSATIONAL" | "PROFESSIONAL" | "FLUENT" | "NATIVE";

export interface ListItem {
  id: string;
  section: ListItemSection;
  value: string;
  proficiency: Proficiency | null;
  sortOrder: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string | null;
  issueDate: string | null;
  credentialUrl: string | null;
  sortOrder: number;
}

export interface Award {
  id: string;
  title: string;
  issuer: string | null;
  awardedDate: string | null;
  description: string | null;
  sortOrder: number;
}

export interface Publication {
  id: string;
  title: string;
  publisher: string | null;
  publishedDate: string | null;
  url: string | null;
  description: string | null;
  sortOrder: number;
}

export interface VolunteerExperience {
  id: string;
  organization: string;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  sortOrder: number;
}

export interface ResumeReference {
  id: string;
  name: string;
  relationship: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  sortOrder: number;
}

export interface CustomSectionItem {
  id: string;
  heading: string;
  subheading: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
}

export interface CustomSection {
  id: string;
  title: string;
  sortOrder: number;
  items: CustomSectionItem[];
}

export interface Resume {
  id: string;
  title: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  websiteUrl: string | null;
  photoUrl: string | null;
  summary: string | null;
  template: Template | null;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  listItems: ListItem[];
  certifications: Certification[];
  awards: Award[];
  publications: Publication[];
  volunteerExperience: VolunteerExperience[];
  references: ResumeReference[];
  customSections: CustomSection[];
  createdAt: string;
  updatedAt: string;
}
