import { useEffect, useRef } from "react";
import { ClassicLayout } from "@/components/templates/ClassicLayout";
import { SidebarLayout } from "@/components/templates/SidebarLayout";
import { getTheme } from "@/components/templates/templateThemes";
import { A4_HEIGHT_MM, A4_HEIGHT_PX, A4_WIDTH_MM, A4_WIDTH_PX, usePageCount } from "@/components/templates/pageMetrics";
import type { Resume } from "@/types/resume.types";

interface PrintPreviewPagesProps {
  resume: Resume;
  templateKey: string | null | undefined;
  scale?: number;
  onPageCountChange?: (count: number) => void;
}

/**
 * Renders the resume once per page, each copy clipped to exactly one A4
 * height and shifted up by that page's offset - so page 2's frame shows only
 * the slice of content between 297mm and 594mm from the top, and so on. This
 * is a lightweight, well-known technique for turning continuously-flowing
 * HTML into an approximate paginated view without a real layout engine.
 *
 * It's an on-screen approximation, not the source of truth: the browser's
 * print engine (via index.css's @page rules) always produces the actual,
 * authoritative pagination when printing/saving as PDF. This view exists so
 * a person can sanity-check "roughly how many pages, roughly where they
 * break" before committing to print - not to be pixel-perfect with it.
 */
export function PrintPreviewPages({ resume, templateKey, scale, onPageCountChange }: PrintPreviewPagesProps) {
  const theme = getTheme(templateKey);
  const Layout = theme.layout === "sidebar" ? SidebarLayout : ClassicLayout;
  const measureRef = useRef<HTMLDivElement>(null);
  const pageCount = usePageCount(measureRef, [resume, templateKey]);

  useEffect(() => {
    onPageCountChange?.(pageCount);
  }, [pageCount, onPageCountChange]);

  return (
    <div className="flex flex-col items-center gap-8">
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <div key={pageIndex} className="flex flex-col items-center">
          {/* Each page has a fixed, known A4 size, so (unlike TemplateRenderer's
              continuous view) the scaled footprint can be computed directly
              without measuring - reserving it so the scaled-down/up page
              doesn't leave a gap or overflow past where the layout thinks it
              ends (see pageMetrics.useMeasuredSize for the full explanation). */}
          <div
            className="resume-a4-page-scale-box"
            style={scale ? { width: A4_WIDTH_PX * scale, height: A4_HEIGHT_PX * scale } : undefined}
          >
            <div
              className="resume-a4-page overflow-hidden bg-white shadow-card"
              style={{
                width: `${A4_WIDTH_MM}mm`,
                height: `${A4_HEIGHT_MM}mm`,
                transform: scale ? `scale(${scale})` : undefined,
                transformOrigin: "top left",
              }}
            >
              <div style={{ marginTop: `${-pageIndex * A4_HEIGHT_MM}mm` }}>
                <div ref={pageIndex === 0 ? measureRef : undefined}>
                  <Layout resume={resume} theme={theme} />
                </div>
              </div>
            </div>
          </div>
          <span className="mt-2 text-[11px] text-ink-900/40 dark:text-paper-50/40">
            Page {pageIndex + 1} of {pageCount}
          </span>
        </div>
      ))}
    </div>
  );
}
