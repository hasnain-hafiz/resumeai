import type { TemplateTheme } from "@/components/templates/templateThemes";
import {
  AwardsBlock, CustomSectionsBlock, EducationBlock, ExperienceBlock,
  orderedSections, ProjectsBlock, PublicationsBlock, ReferencesBlock, SectionHeading, SummaryBlock, VolunteerBlock,
} from "@/components/templates/templateSections";
import type { Resume } from "@/types/resume.types";

function ContactList({ resume, theme }: { resume: Resume; theme: TemplateTheme }) {
  const parts = [resume.email, resume.phone, resume.address, resume.linkedinUrl, resume.githubUrl, resume.portfolioUrl, resume.websiteUrl]
    .filter((p): p is string => !!p);
  if (parts.length === 0) return null;
  return (
    <div className="mb-5 space-y-1">
      {parts.map((p) => (
        <p key={p} className="break-words text-[11px]" style={{ color: theme.colors.sidebarMuted ?? theme.colors.muted }}>{p}</p>
      ))}
    </div>
  );
}

function PhotoOrInitial({ resume, theme }: { resume: Resume; theme: TemplateTheme }) {
  if (theme.photoShape === "none") return null;
  const radius = theme.photoShape === "circle" ? "9999px" : "10px";
  const initial = (resume.fullName || "?").charAt(0).toUpperCase();

  return resume.photoUrl ? (
    <img src={resume.photoUrl} alt="" className="mb-4 h-20 w-20 object-cover" style={{ borderRadius: radius }} />
  ) : (
    <div
      className="mb-4 flex h-20 w-20 items-center justify-center text-2xl font-semibold"
      style={{ borderRadius: radius, backgroundColor: `${theme.colors.accent}26`, color: theme.colors.accent, fontFamily: theme.fonts.display }}
    >
      {initial}
    </div>
  );
}

// Skills rendered inside the (often dark/colored) sidebar need their own
// tag styling pass so pill chips stay legible against a non-white background.
function SkillsSidebarBody({ resume, theme }: { resume: Resume; theme: TemplateTheme }) {
  const sidebarText = theme.colors.sidebarText ?? theme.colors.text;
  const tagBg = "rgba(255,255,255,0.14)";
  const isLightSidebar = ["#FFFFFF", "#F3F6FF", "#FAFAFA", "#F5F1FA"].includes((theme.colors.sidebarBackground ?? "").toUpperCase());

  const groups = ["TECHNICAL_SKILL", "TOOL", "FRAMEWORK", "DATABASE", "PROGRAMMING_LANGUAGE", "SOFT_SKILL"] as const;
  const values = resume.listItems.filter((i) => groups.includes(i.section as (typeof groups)[number]));
  const languages = resume.listItems.filter((i) => i.section === "SPOKEN_LANGUAGE");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v.id}
            className="rounded-full px-2 py-0.5 text-[10.5px]"
            style={
              isLightSidebar
                ? { backgroundColor: `${theme.colors.accent}1A`, color: theme.colors.accent }
                : { backgroundColor: tagBg, color: sidebarText }
            }
          >
            {v.value}
          </span>
        ))}
      </div>
      {languages.length > 0 && (
        <p className="text-[11px]" style={{ color: theme.colors.sidebarMuted ?? theme.colors.muted }}>
          {languages.map((l) => l.value).join(", ")}
        </p>
      )}
    </div>
  );
}

export function SidebarLayout({ resume, theme }: { resume: Resume; theme: TemplateTheme }) {
  const sidebarText = theme.colors.sidebarText ?? theme.colors.text;

  return (
    <div className="grid h-full w-full grid-cols-[34%_66%]" style={{ fontFamily: theme.fonts.body }}>
      {/* Sidebar */}
      <aside className="p-6" style={{ backgroundColor: theme.colors.sidebarBackground ?? theme.colors.background, color: sidebarText }}>
        <PhotoOrInitial resume={resume} theme={theme} />
        <h1 className="mb-1 text-[20px] font-semibold leading-tight" style={{ fontFamily: theme.fonts.display }}>
          {resume.fullName || "Your Name"}
        </h1>
        <ContactList resume={resume} theme={theme} />

        {resume.listItems.length > 0 && (
          <div className="mb-5">
            <SectionHeading theme={theme}>Skills</SectionHeading>
            <SkillsSidebarBody resume={resume} theme={theme} />
          </div>
        )}

        {resume.certifications.length > 0 && (
          <div>
            <SectionHeading theme={theme}>Certifications</SectionHeading>
            <ul className="space-y-1">
              {resume.certifications.map((c) => (
                <li key={c.id} className="text-[11px]" style={{ color: sidebarText }}>{c.name}</li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* Main column - Skills and Certifications are pinned in the sidebar above (fixed to
          this layout's structure), so they're intentionally not part of this reordering set. */}
      <main className="p-6" style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}>
        <SummaryBlock html={resume.summary} theme={theme} />
        {orderedSections(resume.sectionOrder, {
          EXPERIENCE: <ExperienceBlock items={resume.experience} theme={theme} />,
          EDUCATION: <EducationBlock items={resume.education} theme={theme} />,
          PROJECTS: <ProjectsBlock items={resume.projects} theme={theme} />,
          AWARDS: <AwardsBlock items={resume.awards} theme={theme} />,
          PUBLICATIONS: <PublicationsBlock items={resume.publications} theme={theme} />,
          VOLUNTEER: <VolunteerBlock items={resume.volunteerExperience} theme={theme} />,
          REFERENCES: <ReferencesBlock items={resume.references} theme={theme} />,
          CUSTOM_SECTIONS: <CustomSectionsBlock items={resume.customSections} theme={theme} />,
        })}
      </main>
    </div>
  );
}
