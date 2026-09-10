import { useEffect, useRef, useState } from "react";
import { TemplateRenderer } from "@/components/templates/TemplateRenderer";
import { PrintPreviewPages } from "@/components/templates/PrintPreviewPages";
import { PreviewToolbar, ZOOM_MAX, ZOOM_MIN, type PreviewViewMode } from "@/components/templates/PreviewToolbar";
import { A4_WIDTH_PX } from "@/components/templates/pageMetrics";
import type { Resume } from "@/types/resume.types";

interface LivePreviewPanelProps {
  resume: Resume;
  templateKey: string | null | undefined;
  /** Smaller default zoom for the embedded editor panel, which has much less horizontal room than the dedicated Preview page. */
  compact?: boolean;
  className?: string;
}

// Matches the p-6 (1.5rem = 24px) padding on both sides of the scroll
// container below, so "fit to screen" doesn't butt the page right up
// against the container edges.
const PREVIEW_PADDING_PX = 48;

export function LivePreviewPanel({ resume, templateKey, compact, className }: LivePreviewPanelProps) {
  const [zoom, setZoom] = useState(compact ? 0.42 : 0.8);
  const [viewMode, setViewMode] = useState<PreviewViewMode>("continuous");
  const [pageCount, setPageCount] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  // Tracks whether the current zoom came from "Fit" (and should keep
  // auto-refitting on resize) vs. a manual zoom in/out (which should stick
  // until the person asks to fit again). A ref, not state, so the
  // ResizeObserver callback below always reads the latest value without
  // having to tear down and recreate the observer on every zoom change.
  const isFittedRef = useRef(true);

  const computeFitZoom = (): number | null => {
    const el = containerRef.current;
    if (!el) return null;
    const available = el.clientWidth - PREVIEW_PADDING_PX;
    if (available <= 0) return null;
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((available / A4_WIDTH_PX) * 100) / 100));
  };

  const fitToScreen = () => {
    const next = computeFitZoom();
    if (next) setZoom(next);
    isFittedRef.current = true;
  };

  const handleZoomChange = (next: number) => {
    isFittedRef.current = false;
    setZoom(next);
  };

  // Fit once on mount, then keep re-fitting as the panel itself resizes
  // (window resize, sidebar collapse, etc.) as long as the person hasn't
  // manually zoomed since the last fit.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    fitToScreen();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (!isFittedRef.current) return;
      const next = computeFitZoom();
      if (next) setZoom(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl2 border border-ink-900/8 bg-paper-100 dark:border-paper-50/10 dark:bg-ink-950 ${className ?? ""}`}>
      <PreviewToolbar
        zoom={zoom}
        onZoomChange={handleZoomChange}
        onFitToScreen={fitToScreen}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        pageCount={pageCount}
      />
      <div ref={containerRef} className="resume-print-root flex-1 overflow-auto p-6">
        {/*
          Scroll canvas, deliberately separate from the scroll container itself.

          `justify-center` directly on the scroll container's only child does NOT
          work once that child is wider than the container: a flex/block box that's
          pinned to (at most) the container's width still visually centers an
          overflowing child by pushing half the overflow to the LEFT of the box's
          own edge. Browsers only extend `scrollWidth` to cover overflow on the
          right/bottom of a box's own bounds - not negative-offset overflow to the
          left - so that left-side overflow becomes genuinely unreachable by
          scrolling (scrollLeft=0 no longer shows the true left edge). This is a
          well-known flexbox-centering-plus-overflow trap, not specific to the
          resume renderer.

          The fix: let this inner canvas's own width grow to fit its content
          (`w-max`) whenever that content is wider than the container, while never
          shrinking below the container's full width (`min-w-full`). That means:
            - Content narrower than the container -> canvas = container width,
              `justify-center` has room to work and genuinely centers it.
            - Content wider than the container -> canvas width = content width,
              so `justify-center` has zero spare space (a no-op) and the content
              starts flush at the canvas's own left edge - which IS scrollLeft=0.
          Either way, scrollWidth now always covers the entire scaled resume, in
          both directions, and vertical scrolling was never affected by this
          (there's no vertical centering here) - the earlier
          resume-a4-page-scale-box fix already sizes height correctly.
        */}
        <div className="flex min-w-full w-max justify-center">
          {/* On-screen view: whichever mode the toolbar has selected. */}
          <div className={viewMode === "print" ? "print:hidden" : undefined}>
            {viewMode === "continuous" ? (
              <TemplateRenderer resume={resume} templateKey={templateKey} scale={zoom} showPageBreaks onPageCountChange={setPageCount} />
            ) : (
              <PrintPreviewPages resume={resume} templateKey={templateKey} scale={zoom} onPageCountChange={setPageCount} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
