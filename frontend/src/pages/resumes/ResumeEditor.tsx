import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { PersonalInfoSection } from "@/components/resume/PersonalInfoSection";
import { ExperienceSection } from "@/components/resume/ExperienceSection";
import { GenericListSection } from "@/components/resume/GenericListSection";
import { ProjectsSection } from "@/components/resume/ProjectsSection";
import { SkillsSection } from "@/components/resume/SkillsSection";
import { CustomSectionsEditor } from "@/components/resume/CustomSectionsEditor";
import { useResume, useSectionMutations, useUpdateResumeDetails } from "@/hooks/useResumes";
import {
  awardApi, certificationApi, customSectionApi, educationApi, experienceApi,
  listItemApi, projectApi, publicationApi, referenceApi, volunteerExperienceApi,
} from "@/api/resumeSectionsApi";
import { apiErrorMessage } from "@/hooks/useAuth";
import type { Education } from "@/types/resume.types";

const TABS = [
  "Personal Info", "Experience", "Education", "Projects", "Skills",
  "Certifications", "Awards", "Publications", "Volunteer", "References", "Custom Sections",
] as const;
type Tab = (typeof TABS)[number];

export default function ResumeEditorPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("Personal Info");

  const { data: resume, isLoading, isError, error } = useResume(resumeId);
  const updateDetails = useUpdateResumeDetails(resumeId ?? "");

  const experience = useSectionMutations(resumeId ?? "", experienceApi);
  const education = useSectionMutations(resumeId ?? "", educationApi);
  const projects = useSectionMutations(resumeId ?? "", projectApi);
  const listItems = useSectionMutations(resumeId ?? "", listItemApi);
  const certifications = useSectionMutations(resumeId ?? "", certificationApi);
  const awards = useSectionMutations(resumeId ?? "", awardApi);
  const publications = useSectionMutations(resumeId ?? "", publicationApi);
  const volunteer = useSectionMutations(resumeId ?? "", volunteerExperienceApi);
  const references = useSectionMutations(resumeId ?? "", referenceApi);
  const customSections = useSectionMutations(resumeId ?? "", customSectionApi);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["resumes", resumeId] });
  const addProjectImage = useMutation({
    mutationFn: ({ projectId, url }: { projectId: string; url: string }) => projectApi.addImage(resumeId ?? "", projectId, url),
    onSuccess: invalidate,
  });
  const deleteProjectImage = useMutation({
    mutationFn: ({ projectId, imageId }: { projectId: string; imageId: string }) => projectApi.deleteImage(resumeId ?? "", projectId, imageId),
    onSuccess: invalidate,
  });
  const addCustomSectionItem = useMutation({
    mutationFn: ({ sectionId, payload }: { sectionId: string; payload: Record<string, unknown> }) =>
      customSectionApi.addItem(resumeId ?? "", sectionId, payload),
    onSuccess: invalidate,
  });
  const deleteCustomSectionItem = useMutation({
    mutationFn: ({ sectionId, itemId }: { sectionId: string; itemId: string }) =>
      customSectionApi.deleteItem(resumeId ?? "", sectionId, itemId),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-xl2 bg-ink-900/5 dark:bg-paper-50/5" />
      </AppShell>
    );
  }

  if (isError || !resume) {
    return (
      <AppShell>
        <div className="rounded-xl2 border border-danger/20 bg-danger/5 p-6 text-center">
          <p className="mb-3 text-sm text-danger">{apiErrorMessage(error, "Couldn't load this resume.")}</p>
          <button onClick={() => navigate("/resumes")} className="text-sm font-medium text-accent hover:text-accent-hover">
            ← Back to resumes
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => navigate("/resumes")} className="mb-1 text-xs font-medium text-accent hover:text-accent-hover">
            ← All resumes
          </button>
          <h1 className="font-display text-2xl text-ink-950 dark:text-paper-50">{resume.title}</h1>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-ink-900/8 dark:border-paper-50/10 pb-px">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-accent text-accent"
                : "border-transparent text-ink-900/50 hover:text-ink-900 dark:text-paper-50/50 dark:hover:text-paper-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Personal Info" && (
        <PersonalInfoSection resume={resume} onSave={(form) => updateDetails.mutate(form)} isSaving={updateDetails.isPending} />
      )}

      {activeTab === "Experience" && (
        <ExperienceSection
          items={resume.experience}
          onAdd={(form) => experience.add.mutate(form)}
          onUpdate={(id, form) => experience.update.mutate({ itemId: id, payload: form })}
          onDelete={(id) => experience.remove.mutate(id)}
          isSaving={experience.add.isPending || experience.update.isPending}
        />
      )}

      {activeTab === "Education" && (
        <GenericListSection<Education>
          title="Education"
          fields={[
            { name: "school", label: "School", type: "text", required: true },
            { name: "degree", label: "Degree", type: "text" },
            { name: "field", label: "Field of study", type: "text" },
            { name: "cgpa", label: "CGPA", type: "number", placeholder: "0.0 - 10.0" },
            { name: "startDate", label: "Start date", type: "date" },
            { name: "endDate", label: "End date", type: "date" },
          ]}
          items={resume.education}
          titleField="school"
          subtitleField="degree"
          onAdd={(values) => education.add.mutate({ ...values, cgpa: values.cgpa ? Number(values.cgpa) : null, sortOrder: 0 } as never)}
          onUpdate={(id, values) => education.update.mutate({ itemId: id, payload: { ...values, cgpa: values.cgpa ? Number(values.cgpa) : null, sortOrder: 0 } as never })}
          onDelete={(id) => education.remove.mutate(id)}
          isSaving={education.add.isPending || education.update.isPending}
        />
      )}

      {activeTab === "Projects" && (
        <ProjectsSection
          items={resume.projects}
          onAdd={(form) => projects.add.mutate(form as never)}
          onUpdate={(id, form) => projects.update.mutate({ itemId: id, payload: form as never })}
          onDelete={(id) => projects.remove.mutate(id)}
          onAddImage={(projectId, url) => addProjectImage.mutate({ projectId, url })}
          onDeleteImage={(projectId, imageId) => deleteProjectImage.mutate({ projectId, imageId })}
          isSaving={projects.add.isPending || projects.update.isPending}
        />
      )}

      {activeTab === "Skills" && (
        <SkillsSection
          items={resume.listItems}
          onAdd={(section, value, proficiency) => listItems.add.mutate({ section, value, proficiency, sortOrder: 0 })}
          onDelete={(id) => listItems.remove.mutate(id)}
        />
      )}

      {activeTab === "Certifications" && (
        <GenericListSection
          title="Certifications"
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "issuer", label: "Issuer", type: "text" },
            { name: "issueDate", label: "Issue date", type: "date" },
            { name: "credentialUrl", label: "Credential URL", type: "url" },
          ]}
          items={resume.certifications}
          titleField="name"
          subtitleField="issuer"
          onAdd={(values) => certifications.add.mutate({ ...values, sortOrder: 0 } as never)}
          onUpdate={(id, values) => certifications.update.mutate({ itemId: id, payload: { ...values, sortOrder: 0 } as never })}
          onDelete={(id) => certifications.remove.mutate(id)}
          isSaving={certifications.add.isPending || certifications.update.isPending}
        />
      )}

      {activeTab === "Awards" && (
        <GenericListSection
          title="Awards"
          fields={[
            { name: "title", label: "Title", type: "text", required: true },
            { name: "issuer", label: "Issuer", type: "text" },
            { name: "awardedDate", label: "Date", type: "date" },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          items={resume.awards}
          titleField="title"
          subtitleField="issuer"
          onAdd={(values) => awards.add.mutate({ ...values, sortOrder: 0 } as never)}
          onUpdate={(id, values) => awards.update.mutate({ itemId: id, payload: { ...values, sortOrder: 0 } as never })}
          onDelete={(id) => awards.remove.mutate(id)}
          isSaving={awards.add.isPending || awards.update.isPending}
        />
      )}

      {activeTab === "Publications" && (
        <GenericListSection
          title="Publications"
          fields={[
            { name: "title", label: "Title", type: "text", required: true },
            { name: "publisher", label: "Publisher", type: "text" },
            { name: "publishedDate", label: "Published date", type: "date" },
            { name: "url", label: "URL", type: "url" },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          items={resume.publications}
          titleField="title"
          subtitleField="publisher"
          onAdd={(values) => publications.add.mutate({ ...values, sortOrder: 0 } as never)}
          onUpdate={(id, values) => publications.update.mutate({ itemId: id, payload: { ...values, sortOrder: 0 } as never })}
          onDelete={(id) => publications.remove.mutate(id)}
          isSaving={publications.add.isPending || publications.update.isPending}
        />
      )}

      {activeTab === "Volunteer" && (
        <GenericListSection
          title="Volunteer experience"
          fields={[
            { name: "organization", label: "Organization", type: "text", required: true },
            { name: "role", label: "Role", type: "text" },
            { name: "startDate", label: "Start date", type: "date" },
            { name: "endDate", label: "End date", type: "date" },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          items={resume.volunteerExperience}
          titleField="organization"
          subtitleField="role"
          onAdd={(values) => volunteer.add.mutate({ ...values, sortOrder: 0 } as never)}
          onUpdate={(id, values) => volunteer.update.mutate({ itemId: id, payload: { ...values, sortOrder: 0 } as never })}
          onDelete={(id) => volunteer.remove.mutate(id)}
          isSaving={volunteer.add.isPending || volunteer.update.isPending}
        />
      )}

      {activeTab === "References" && (
        <GenericListSection
          title="References"
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "relationship", label: "Relationship", type: "text" },
            { name: "company", label: "Company", type: "text" },
            { name: "email", label: "Email", type: "email" },
            { name: "phone", label: "Phone", type: "text" },
          ]}
          items={resume.references}
          titleField="name"
          subtitleField="relationship"
          onAdd={(values) => references.add.mutate({ ...values, sortOrder: 0 } as never)}
          onUpdate={(id, values) => references.update.mutate({ itemId: id, payload: { ...values, sortOrder: 0 } as never })}
          onDelete={(id) => references.remove.mutate(id)}
          isSaving={references.add.isPending || references.update.isPending}
        />
      )}

      {activeTab === "Custom Sections" && (
        <CustomSectionsEditor
          sections={resume.customSections}
          onAddSection={(title) => customSections.add.mutate({ title, sortOrder: 0 })}
          onDeleteSection={(id) => customSections.remove.mutate(id)}
          onAddItem={(sectionId, form) => addCustomSectionItem.mutate({ sectionId, payload: { ...form, sortOrder: 0 } })}
          onDeleteItem={(sectionId, itemId) => deleteCustomSectionItem.mutate({ sectionId, itemId })}
        />
      )}
    </AppShell>
  );
}
