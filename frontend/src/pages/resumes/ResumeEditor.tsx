import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { PersonalInfoSection, type DetailsForm } from "@/components/resume/PersonalInfoSection";
import { ExperienceSection } from "@/components/resume/ExperienceSection";
import { GenericListSection } from "@/components/resume/GenericListSection";
import { ProjectsSection } from "@/components/resume/ProjectsSection";
import { SkillsSection } from "@/components/resume/SkillsSection";
import { CustomSectionsEditor } from "@/components/resume/CustomSectionsEditor";
import { LivePreviewPanel } from "@/components/resume/LivePreviewPanel";
import { useResume, useSectionMutations, useUpdateResumeDetails } from "@/hooks/useResumes";
import {
  awardApi, certificationApi, customSectionApi, educationApi, experienceApi,
  listItemApi, projectApi, publicationApi, referenceApi, volunteerExperienceApi,
} from "@/api/resumeSectionsApi";
import { apiErrorMessage } from "@/hooks/useAuth";
import type {
  Award, Certification, Education, Experience, Project, Publication, Resume, ResumeReference, VolunteerExperience,
} from "@/types/resume.types";

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

  // Unsaved Personal Info / Summary edits, reported live by PersonalInfoSection
  // on every keystroke - this is what makes the preview "instant while
  // editing" rather than only updating after a save. See the sectionDrafts
  // block below for the equivalent treatment of the list-based sections
  // (Experience, Education, Projects, Certifications, Awards, Publications,
  // Volunteer, References).
  const [draftDetails, setDraftDetails] = useState<DetailsForm | null>(null);
  useEffect(() => setDraftDetails(null), [resumeId]);

  // Same "unsaved, instant" idea as draftDetails above, generalized to the
  // list-based sections (Experience, Education, Projects, Certifications,
  // Awards, Publications, Volunteer, References). Each section reports the
  // in-progress add/edit form merged into its list on every keystroke - no
  // API calls, just local state - so the preview reflects it immediately
  // instead of waiting for the section's mutation to round-trip and refetch.
  // A key is only present here while that section has an unsaved edit open.
  type SectionDrafts = {
    experience?: Experience[];
    education?: Education[];
    projects?: Project[];
    certifications?: Certification[];
    awards?: Award[];
    publications?: Publication[];
    volunteerExperience?: VolunteerExperience[];
    references?: ResumeReference[];
  };
  const [sectionDrafts, setSectionDrafts] = useState<SectionDrafts>({});
  useEffect(() => setSectionDrafts({}), [resumeId]);
  const setSectionDraft = <K extends keyof SectionDrafts>(key: K) => (items: SectionDrafts[K] | undefined) =>
    setSectionDrafts((d) => {
      if (items === undefined) {
        // Omit the key entirely rather than setting it to `undefined` -
        // `previewResume` spreads sectionDrafts over the real resume, and a
        // present-but-undefined key would still win the spread, clobbering
        // the real (saved) array with `undefined` instead of falling back
        // to it.
        if (!(key in d)) return d;
        const next = { ...d };
        delete next[key];
        return next;
      }
      return d[key] === items ? d : { ...d, [key]: items };
    });

  const previewResume: Resume | undefined = useMemo(() => {
    if (!resume) return undefined;
    return { ...resume, ...(draftDetails ?? {}), ...sectionDrafts };
  }, [resume, draftDetails, sectionDrafts]);

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={() => navigate("/resumes")} className="mb-1 text-xs font-medium text-accent hover:text-accent-hover">
            ← All resumes
          </button>
          <h1 className="font-display text-2xl text-ink-950 dark:text-paper-50">{resume.title}</h1>
          {resume.template && (
            <p className="mt-0.5 text-xs text-ink-900/45 dark:text-paper-50/45">Template: {resume.template.name}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/resumes/${resumeId}/templates`)}
            className="rounded-xl border border-ink-900/10 dark:border-paper-50/15 px-4 py-2 text-sm font-medium text-ink-900 dark:text-paper-50 hover:bg-ink-900/[0.03] dark:hover:bg-paper-50/5"
          >
            {resume.template ? "Change template" : "Choose template"}
          </button>
          <button
            onClick={() => navigate(`/resumes/${resumeId}/preview`)}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Preview
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div>
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
            <PersonalInfoSection
              resume={resume}
              onSave={(form) => updateDetails.mutate(form)}
              isSaving={updateDetails.isPending}
              onDraftChange={setDraftDetails}
            />
          )}

          {activeTab === "Experience" && (
            <ExperienceSection
              items={resume.experience}
              onAdd={(form) => experience.add.mutate(form)}
              onUpdate={(id, form) => experience.update.mutate({ itemId: id, payload: form })}
              onDelete={(id) => experience.remove.mutate(id)}
              isSaving={experience.add.isPending || experience.update.isPending}
              onDraftItems={setSectionDraft("experience")}
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
              onDraftItems={setSectionDraft("education")}
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
              onDraftItems={setSectionDraft("projects")}
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
              onDraftItems={setSectionDraft("certifications")}
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
              onDraftItems={setSectionDraft("awards")}
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
              onDraftItems={setSectionDraft("publications")}
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
              onDraftItems={setSectionDraft("volunteerExperience")}
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
              onDraftItems={setSectionDraft("references")}
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
        </div>

        {previewResume && (
          <div className="h-[70vh] lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
            <LivePreviewPanel resume={previewResume} templateKey={resume.template?.key} compact className="h-full" />
          </div>
        )}
      </div>
    </AppShell>
  );
}
