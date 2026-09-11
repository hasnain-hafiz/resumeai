import type { TemplateTheme } from "@/components/templates/templateThemes";
import {
  AwardsBlock, CertificationsBlock, CustomSectionsBlock, EducationBlock, ExperienceBlock,
  orderedSections, ProjectsBlock, PublicationsBlock, ReferencesBlock, SkillsBlock, SummaryBlock, VolunteerBlock,
} from "@/components/templates/templateSections";
import type { Resume } from "@/types/resume.types";

function ContactLine({ resume, theme }: { resume: Resume; theme: TemplateTheme }) {
  const parts = [resume.email, resume.phone, resume.address, resume.linkedinUrl, resume.githubUrl, resume.portfolioUrl, resume.websiteUrl]
    .filter((p): p is string => !!p);
  if (parts.length === 0) return null;
  return (
    <p className="text-[11.5px]" style={{ color: theme.colors.muted }}>
      {parts.join("  \u00b7  ")}
    </p>
  );
}

export function ClassicLayout({ resume, theme }: { resume: Resume; theme: TemplateTheme }) {
  const headerAlign = theme.headingStyle === "plain" ? "text-left" : "text-center";

  return (
    <div style={{ fontFamily: theme.fonts.body, color: theme.colors.text, backgroundColor: theme.colors.background }} className="h-full w-full p-10">
      <header className={`mb-6 ${headerAlign}`} style={theme.headingStyle === "bar" ? { borderBottom: `2px solid ${theme.colors.accent}`, paddingBottom: "1rem" } : undefined}>
        <h1 className="text-[26px] font-semibold" style={{ fontFamily: theme.fonts.display, color: theme.colors.text }}>
          {resume.fullName || "Your Name"}
        </h1>
        <div className="mt-1.5">
          <ContactLine resume={resume} theme={theme} />
        </div>
      </header>

      <SummaryBlock html={resume.summary} theme={theme} />
      {orderedSections(resume.sectionOrder, {
        EXPERIENCE: <ExperienceBlock items={resume.experience} theme={theme} />,
        EDUCATION: <EducationBlock items={resume.education} theme={theme} />,
        PROJECTS: <ProjectsBlock items={resume.projects} theme={theme} />,
        SKILLS: <SkillsBlock items={resume.listItems} theme={theme} layout={theme.skillsLayout} />,
        CERTIFICATIONS: <CertificationsBlock items={resume.certifications} theme={theme} />,
        AWARDS: <AwardsBlock items={resume.awards} theme={theme} />,
        PUBLICATIONS: <PublicationsBlock items={resume.publications} theme={theme} />,
        VOLUNTEER: <VolunteerBlock items={resume.volunteerExperience} theme={theme} />,
        REFERENCES: <ReferencesBlock items={resume.references} theme={theme} />,
        CUSTOM_SECTIONS: <CustomSectionsBlock items={resume.customSections} theme={theme} />,
      })}
    </div>
  );
}
