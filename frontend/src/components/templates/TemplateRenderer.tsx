import { useEffect, useRef } from "react";
import { ClassicLayout } from "@/components/templates/ClassicLayout";
import { SidebarLayout } from "@/components/templates/SidebarLayout";
import { getTheme } from "@/components/templates/templateThemes";
import { A4_HEIGHT_MM, A4_WIDTH_MM, useMeasuredSize, usePageCount } from "@/components/templates/pageMetrics";
import { PageBreakOverlay } from "@/components/templates/PageBreakOverlay";
import type { Resume } from "@/types/resume.types";

interface TemplateRendererProps {
  resume: Resume;
  templateKey: string | null | undefined;
  /** CSS scale factor for thumbnail-sized previews (e.g. 0.22 for a gallery card). Omit for full size. */
  scale?: number;
  /** Overlay dashed page-break lines + "Page N" labels wherever the content would split across printed pages. */
  showPageBreaks?: boolean;
  /** Fires whenever the measured page count changes - lets a parent (e.g. a preview toolbar) show "Page 1 of 3". */
  onPageCountChange?: (count: number) => void;
}

/**
 * Renders one continuous A4-width column at the given template's theme.
 * Content that spans more than one printed page simply continues flowing
 * below the first page's height - real pagination for print is handled by
 * the browser's print engine (see index.css's @page/@media print rules).
 * `showPageBreaks` adds an on-screen guide for where those breaks will
 * actually fall, without changing how anything is laid out.
 */
export function TemplateRenderer({ resume, templateKey, scale, showPageBreaks, onPageCountChange }: TemplateRendererProps) {
  const theme = getTheme(templateKey);
  const Layout = theme.layout === "sidebar" ? SidebarLayout : ClassicLayout;
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Re-measure whenever the resume content or template (which can change
  // section spacing/typography and therefore height) changes, in addition to
  // the ResizeObserver the hook itself sets up for pure size changes.
  const pageCount = usePageCount(contentRef, [resume, templateKey]);

  // The page's real, un-scaled size - see useMeasuredSize for why this is
  // needed alongside the `transform: scale(...)` below.
  const naturalSize = useMeasuredSize(pageRef);

  useEffect(() => {
    onPageCountChange?.(pageCount);
  }, [pageCount, onPageCountChange]);

  const page = (
    <div
      ref={pageRef}
      className="resume-a4-page relative overflow-hidden bg-white shadow-card"
      style={{ width: `${A4_WIDTH_MM}mm`, transform: scale ? `scale(${scale})` : undefined, transformOrigin: "top left" }}
    >
      <div ref={contentRef} style={{ minHeight: `${A4_HEIGHT_MM}mm` }}>
        <Layout resume={resume} theme={theme} />
      </div>
      {showPageBreaks && <PageBreakOverlay pageCount={pageCount} />}
    </div>
  );

  if (!scale) return page;

  // Reserve exactly the scaled-down (or up) footprint so the surrounding
  // layout - centering, scrolling - is based on what's actually visible,
  // not the page's full un-scaled size.
  return (
    <div
      className="resume-a4-page-scale-box"
      style={{ width: naturalSize.width * scale, height: naturalSize.height * scale }}
    >
      {page}
    </div>
  );
}
