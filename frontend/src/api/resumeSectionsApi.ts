import { apiClient } from "@/lib/axiosClient";
import { createSectionApi } from "@/api/resumeApi";
import type {
  Award,
  Certification,
  CustomSection,
  Education,
  Experience,
  ListItem,
  Project,
  Publication,
  ResumeReference,
  VolunteerExperience,
} from "@/types/resume.types";

export const experienceApi = createSectionApi<Omit<Experience, "id">, Experience>("experience");
export const educationApi = createSectionApi<Omit<Education, "id">, Education>("education");
export const certificationApi = createSectionApi<Omit<Certification, "id">, Certification>("certifications");
export const awardApi = createSectionApi<Omit<Award, "id">, Award>("awards");
export const publicationApi = createSectionApi<Omit<Publication, "id">, Publication>("publications");
export const volunteerExperienceApi = createSectionApi<Omit<VolunteerExperience, "id">, VolunteerExperience>("volunteer-experience");
export const referenceApi = createSectionApi<Omit<ResumeReference, "id">, ResumeReference>("references");
export const listItemApi = createSectionApi<Omit<ListItem, "id">, ListItem>("list-items");

// Projects: same add/update/delete shape, plus a nested images sub-resource -
// both return the whole updated Project (with its images array), not just the image.
export const projectApi = {
  ...createSectionApi<Omit<Project, "id" | "images">, Project>("projects"),
  addImage: (resumeId: string, projectId: string, url: string) =>
    apiClient.post<Project>(`/resumes/${resumeId}/projects/${projectId}/images`, { url, sortOrder: 0 }).then((r) => r.data),
  deleteImage: (resumeId: string, projectId: string, imageId: string) =>
    apiClient.delete<Project>(`/resumes/${resumeId}/projects/${projectId}/images/${imageId}`).then((r) => r.data),
};

// Custom sections: same add/update/delete shape for the section itself, plus a
// nested items sub-resource - both return the whole updated section (with items).
export const customSectionApi = {
  ...createSectionApi<{ title: string; sortOrder: number }, CustomSection>("custom-sections"),
  addItem: (resumeId: string, sectionId: string, payload: Record<string, unknown>) =>
    apiClient.post<CustomSection>(`/resumes/${resumeId}/custom-sections/${sectionId}/items`, payload).then((r) => r.data),
  updateItem: (resumeId: string, sectionId: string, itemId: string, payload: Record<string, unknown>) =>
    apiClient.put<CustomSection>(`/resumes/${resumeId}/custom-sections/${sectionId}/items/${itemId}`, payload).then((r) => r.data),
  deleteItem: (resumeId: string, sectionId: string, itemId: string) =>
    apiClient.delete<CustomSection>(`/resumes/${resumeId}/custom-sections/${sectionId}/items/${itemId}`).then((r) => r.data),
};
