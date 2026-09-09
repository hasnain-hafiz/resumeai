import { useState } from "react";
import { TemplateRenderer } from "@/components/templates/TemplateRenderer";
import { PrintPreviewPages } from "@/components/templates/PrintPreviewPages";
import { PreviewToolbar, type PreviewViewMode } from "@/components/templates/PreviewToolbar";
import type { Resume } from "@/types/resume.types";

interface LivePreviewPanelProps {
  resume: Resume;
  templateKey: string | null | undefined;
  /** Smaller default zoom for the embedded editor panel, which has much less horizontal room than the dedicated Preview page. */
  compact?: boolean;
  className?: string;
}

export function LivePreviewPanel({ resume, templateKey, compact, className }: LivePreviewPanelProps) {
  const [zoom, setZoom] = useState(compact ? 0.42 : 0.8);
  const [viewMode, setViewMode] = useState<PreviewViewMode>("continuous");
  const [pageCount, setPageCount] = useState(1);

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl2 border border-ink-900/8 bg-paper-100 dark:border-paper-50/10 dark:bg-ink-950 ${className ?? ""}`}>
      <PreviewToolbar zoom={zoom} onZoomChange={setZoom} viewMode={viewMode} onViewModeChange={setViewMode} pageCount={pageCount} />
      <div className="resume-print-root flex-1 overflow-auto p-6">
        <div className="flex justify-center">
          {/* On-screen view: whichever mode the toolbar has selected. */}
          <div className={viewMode === "print" ? "print:hidden" : undefined}>
            {viewMode === "continuous" ? (
              <TemplateRenderer resume={resume} templateKey={templateKey} scale={zoom} showPageBreaks onPageCountChange={setPageCount} />
            ) : (
              <PrintPreviewPages resume={resume} templateKey={templateKey} scale={zoom} onPageCountChange={setPageCount} />
            )}
          </div>
          {/* Print output: always the real, continuously-flowing content, regardless of
              which on-screen mode is active. Print Preview's windowed pages are a visual
              approximation for on-screen guidance only - printing them directly would
              include their gaps and "Page X of Y" labels and wouldn't reliably break
              exactly at each frame boundary, so print always uses the browser's own
              (correct) pagination via the real content instead. */}
          {viewMode === "print" && (
            <div className="hidden print:block">
              <TemplateRenderer resume={resume} templateKey={templateKey} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
