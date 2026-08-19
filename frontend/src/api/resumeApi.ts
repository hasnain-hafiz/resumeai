import { apiClient } from "@/lib/axiosClient";
import type { Resume, ResumeSummary } from "@/types/resume.types";

export const resumeApi = {
  list: () => apiClient.get<ResumeSummary[]>("/resumes").then((r) => r.data),

  create: (title: string) => apiClient.post<ResumeSummary>("/resumes", { title }).then((r) => r.data),

  get: (resumeId: string) => apiClient.get<Resume>(`/resumes/${resumeId}`).then((r) => r.data),

  updateDetails: (resumeId: string, payload: Omit<Resume, "id" | "experience" | "education" | "projects" | "listItems" | "certifications" | "awards" | "publications" | "volunteerExperience" | "references" | "customSections" | "createdAt" | "updatedAt">) =>
    apiClient.put<Resume>(`/resumes/${resumeId}`, payload).then((r) => r.data),

  delete: (resumeId: string) => apiClient.delete(`/resumes/${resumeId}`).then((r) => r.data),
};

/**
 * Every resume sub-section (experience, education, certifications, ...) exposes
 * the same three endpoints: POST to add, PUT to update, DELETE to remove, all
 * nested under /resumes/{resumeId}/{sectionPath}. Rather than hand-writing the
 * same three functions ten times, this factory builds them once per section.
 */
export function createSectionApi<TRequest, TResponse>(sectionPath: string) {
  return {
    add: (resumeId: string, payload: TRequest) =>
      apiClient.post<TResponse>(`/resumes/${resumeId}/${sectionPath}`, payload).then((r) => r.data),
    update: (resumeId: string, itemId: string, payload: TRequest) =>
      apiClient.put<TResponse>(`/resumes/${resumeId}/${sectionPath}/${itemId}`, payload).then((r) => r.data),
    remove: (resumeId: string, itemId: string) =>
      apiClient.delete(`/resumes/${resumeId}/${sectionPath}/${itemId}`).then((r) => r.data),
  };
}
