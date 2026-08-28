import { ClassicLayout } from "@/components/templates/ClassicLayout";
import { SidebarLayout } from "@/components/templates/SidebarLayout";
import { getTheme } from "@/components/templates/templateThemes";
import type { Resume } from "@/types/resume.types";

interface TemplateRendererProps {
  resume: Resume;
  templateKey: string | null | undefined;
  /** CSS scale factor for thumbnail-sized previews (e.g. 0.22 for a gallery card). Omit for full size. */
  scale?: number;
}

/**
 * Renders one A4 page (210mm x 297mm) at the given template's theme. Content
 * that overflows one page height simply continues below it on screen - real
 * pagination for print is handled by the browser's print engine (see
 * index.css's @page/@media print rules), not simulated here. On-screen
 * multi-page visualization (explicit page-break markers, zoom controls) is
 * the Live Preview feature's job, not this one's.
 */
export function TemplateRenderer({ resume, templateKey, scale }: TemplateRendererProps) {
  const theme = getTheme(templateKey);
  const Layout = theme.layout === "sidebar" ? SidebarLayout : ClassicLayout;

  return (
    <div
      className="resume-a4-page overflow-hidden bg-white shadow-card"
      style={{
        width: "210mm",
        minHeight: "297mm",
        transform: scale ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
      }}
    >
      <Layout resume={resume} theme={theme} />
    </div>
  );
}
