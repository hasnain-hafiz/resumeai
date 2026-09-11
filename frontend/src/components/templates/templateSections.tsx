import { Fragment, type ReactNode } from "react";
import type { TemplateTheme } from "@/components/templates/templateThemes";
import type {
  Award, Certification, CustomSection, Education, Experience, ListItem, Project, Publication,
  ResumeReference, VolunteerExperience,
} from "@/types/resume.types";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatMonthYear(iso: string | null): string {
  if (!iso) return "";
  const [year, month] = iso.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = Number(month);
  return m >= 1 && m <= 12 ? `${monthNames[m - 1]} ${year}` : year;
}

function dateRange(start: string | null, end: string | null, current: boolean): string {
  const startLabel = formatMonthYear(start);
  const endLabel = current ? "Present" : formatMonthYear(end);
  if (!startLabel && !endLabel) return "";
  return `${startLabel} \u2013 ${endLabel}`;
}

/** Section heading whose visual treatment varies by theme.headingStyle - the main lever for "does this look like a different template." */
export function SectionHeading({ theme, children }: { theme: TemplateTheme; children: ReactNode }) {
  const base = "mb-2 text-[13px] font-semibold tracking-wide";
  switch (theme.headingStyle) {
    case "uppercase":
      return <h2 className={`${base} uppercase`} style={{ color: theme.colors.accent, letterSpacing: "0.08em" }}>{children}</h2>;
    case "bordered":
      return (
        <h2 className={`${base} pb-1 uppercase`} style={{ color: theme.colors.text, borderBottom: `1px solid ${theme.colors.divider}`, letterSpacing: "0.04em" }}>
          {children}
        </h2>
      );
    case "bar":
      return (
        <h2 className={`${base} border-l-[3px] pl-2 uppercase`} style={{ color: theme.colors.text, borderColor: theme.colors.accent, letterSpacing: "0.04em" }}>
          {children}
        </h2>
      );
    case "plain":
    default:
      return <h2 className={base} style={{ color: theme.colors.accent, fontFamily: theme.fonts.display }}>{children}</h2>;
  }
}

const gapForDensity = { compact: "space-y-2.5", comfortable: "space-y-4", spacious: "space-y-5" };
export function sectionGap(theme: TemplateTheme) {
  return gapForDensity[theme.density];
}

export function ExperienceBlock({ items, theme }: { items: Experience[]; theme: TemplateTheme }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-5">
      <SectionHeading theme={theme}>Experience</SectionHeading>
      <div className={sectionGap(theme)}>
        {items.map((item) => (
          <div key={item.id} style={{ breakInside: "avoid" }}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13.5px] font-semibold" style={{ color: theme.colors.text }}>{item.position}</p>
              <p className="shrink-0 text-[11px]" style={{ color: theme.colors.muted }}>
                {dateRange(item.startDate, item.endDate, item.current)}
              </p>
            </div>
            <p className="text-[12.5px]" style={{ color: theme.colors.accent }}>
              {item.company}{item.location ? ` \u00b7 ${item.location}` : ""}
            </p>
            {item.responsibilities && (
              <p className="mt-1 text-[12px] leading-relaxed" style={{ color: theme.colors.text }}>{item.responsibilities}</p>
            )}
            {item.achievements && (
              <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: theme.colors.muted }}>{item.achievements}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function EducationBlock({ items, theme }: { items: Education[]; theme: TemplateTheme }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-5">
      <SectionHeading theme={theme}>Education</SectionHeading>
      <div className={sectionGap(theme)}>
        {items.map((item) => (
          <div key={item.id} style={{ breakInside: "avoid" }}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13px] font-semibold" style={{ color: theme.colors.text }}>{item.school}</p>
              <p className="shrink-0 text-[11px]" style={{ color: theme.colors.muted }}>{dateRange(item.startDate, item.endDate, false)}</p>
            </div>
            <p className="text-[12px]" style={{ color: theme.colors.muted }}>
              {[item.degree, item.field].filter(Boolean).join(", ")}
              {item.cgpa ? ` \u00b7 GPA ${item.cgpa}` : ""}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProjectsBlock({ items, theme }: { items: Project[]; theme: TemplateTheme }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-5">
      <SectionHeading theme={theme}>Projects</SectionHeading>
      <div className={sectionGap(theme)}>
        {items.map((item) => (
          <div key={item.id} style={{ breakInside: "avoid" }}>
            <p className="text-[13px] font-semibold" style={{ color: theme.colors.text }}>{item.title}</p>
            {item.technologies && <p className="text-[11.5px]" style={{ color: theme.colors.accent }}>{item.technologies}</p>}
            {item.description && <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: theme.colors.text }}>{item.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SkillsBlock({ items, theme, layout }: { items: ListItem[]; theme: TemplateTheme; layout: "tags" | "lines" }) {
  const groups: { label: string; section: ListItem["section"] }[] = [
    { label: "Technical Skills", section: "TECHNICAL_SKILL" },
    { label: "Soft Skills", section: "SOFT_SKILL" },
    { label: "Tools", section: "TOOL" },
    { label: "Frameworks", section: "FRAMEWORK" },
    { label: "Databases", section: "DATABASE" },
    { label: "Languages", section: "PROGRAMMING_LANGUAGE" },
    { label: "Interests", section: "INTEREST" },
  ];
  const nonEmptyGroups = groups.map((g) => ({ ...g, values: items.filter((i) => i.section === g.section) })).filter((g) => g.values.length > 0);
  const spokenLanguages = items.filter((i) => i.section === "SPOKEN_LANGUAGE");

  if (nonEmptyGroups.length === 0 && spokenLanguages.length === 0) return null;

  return (
    <section className="mb-5">
      <SectionHeading theme={theme}>Skills</SectionHeading>
      <div className={layout === "tags" ? "space-y-2.5" : "space-y-1.5"}>
        {nonEmptyGroups.map((g) => (
          <div key={g.section}>
            {layout === "lines" && <span className="text-[12px] font-medium" style={{ color: theme.colors.text }}>{g.label}: </span>}
            {layout === "tags" ? (
              <>
                <p className="mb-1 text-[10.5px] font-medium uppercase tracking-wide" style={{ color: theme.colors.muted }}>{g.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.values.map((v) => (
                    <span
                      key={v.id}
                      className="rounded-full px-2 py-0.5 text-[11px]"
                      style={{ backgroundColor: `${theme.colors.accent}1A`, color: theme.colors.accent }}
                    >
                      {v.value}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <span className="text-[12px]" style={{ color: theme.colors.muted }}>{g.values.map((v) => v.value).join(", ")}</span>
            )}
          </div>
        ))}
        {spokenLanguages.length > 0 && (
          <div>
            {layout === "lines" && <span className="text-[12px] font-medium" style={{ color: theme.colors.text }}>Languages: </span>}
            <span className="text-[12px]" style={{ color: theme.colors.muted }}>
              {spokenLanguages.map((l) => `${l.value}${l.proficiency ? ` (${l.proficiency.toLowerCase()})` : ""}`).join(", ")}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export function CertificationsBlock({ items, theme }: { items: Certification[]; theme: TemplateTheme }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-5">
      <SectionHeading theme={theme}>Certifications</SectionHeading>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="text-[12px]" style={{ color: theme.colors.text }}>
            <span className="font-medium">{item.name}</span>
            {item.issuer && <span style={{ color: theme.colors.muted }}> — {item.issuer}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AwardsBlock({ items, theme }: { items: Award[]; theme: TemplateTheme }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-5">
      <SectionHeading theme={theme}>Awards</SectionHeading>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="text-[12px]" style={{ color: theme.colors.text }}>
            <span className="font-medium">{item.title}</span>
            {item.issuer && <span style={{ color: theme.colors.muted }}> — {item.issuer}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PublicationsBlock({ items, theme }: { items: Publication[]; theme: TemplateTheme }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-5">
      <SectionHeading theme={theme}>Publications</SectionHeading>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="text-[12px]" style={{ color: theme.colors.text }}>
            <span className="font-medium">{item.title}</span>
            {item.publisher && <span style={{ color: theme.colors.muted }}> — {item.publisher}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function VolunteerBlock({ items, theme }: { items: VolunteerExperience[]; theme: TemplateTheme }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-5">
      <SectionHeading theme={theme}>Volunteer Experience</SectionHeading>
      <div className={sectionGap(theme)}>
        {items.map((item) => (
          <div key={item.id}>
            <p className="text-[13px] font-semibold" style={{ color: theme.colors.text }}>{item.organization}</p>
            {item.role && <p className="text-[12px]" style={{ color: theme.colors.accent }}>{item.role}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReferencesBlock({ items, theme }: { items: ResumeReference[]; theme: TemplateTheme }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-5">
      <SectionHeading theme={theme}>References</SectionHeading>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.id} className="text-[12px]" style={{ color: theme.colors.text }}>
            <p className="font-medium">{item.name}</p>
            {(item.relationship || item.company) && (
              <p style={{ color: theme.colors.muted }}>{[item.relationship, item.company].filter(Boolean).join(", ")}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function CustomSectionsBlock({ items, theme }: { items: CustomSection[]; theme: TemplateTheme }) {
  if (items.length === 0) return null;
  return (
    <>
      {items.map((section) => (
        <section key={section.id} className="mb-5">
          <SectionHeading theme={theme}>{section.title}</SectionHeading>
          <div className={sectionGap(theme)}>
            {section.items.map((item) => (
              <div key={item.id}>
                <p className="text-[13px] font-semibold" style={{ color: theme.colors.text }}>{item.heading}</p>
                {item.subheading && <p className="text-[12px]" style={{ color: theme.colors.accent }}>{item.subheading}</p>}
                {item.description && <p className="mt-0.5 text-[12px]" style={{ color: theme.colors.text }}>{item.description}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

export function SummaryBlock({ html, theme }: { html: string | null; theme: TemplateTheme }) {
  if (!html || stripHtml(html).length === 0) return null;
  return (
    <section className="mb-5">
      <SectionHeading theme={theme}>Summary</SectionHeading>
      <div
        className="text-[12.5px] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5"
        style={{ color: theme.colors.text }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}

/**
 * Renders a set of section blocks in the order the user dragged them into
 * (Feature 6) - `blocks` only needs to include the keys a given layout
 * actually places in this column (e.g. SidebarLayout omits SKILLS and
 * CERTIFICATIONS here because those render fixed in its sidebar instead).
 * Any key missing from `sectionOrder` (shouldn't happen once every resume
 * is seeded with the full canonical order, but kept defensive) still
 * renders, appended at the end, so a section can never silently vanish.
 */
export function orderedSections(
  sectionOrder: readonly string[] | null | undefined,
  blocks: Partial<Record<string, ReactNode>>
): ReactNode[] {
  const availableKeys = Object.keys(blocks);
  const order = sectionOrder && sectionOrder.length > 0 ? sectionOrder : availableKeys;

  const seen = new Set<string>();
  const result: ReactNode[] = [];

  for (const key of order) {
    if (blocks[key] !== undefined && !seen.has(key)) {
      seen.add(key);
      result.push(<Fragment key={key}>{blocks[key]}</Fragment>);
    }
  }
  for (const key of availableKeys) {
    if (!seen.has(key)) {
      seen.add(key);
      result.push(<Fragment key={key}>{blocks[key]}</Fragment>);
    }
  }

  return result;
}
