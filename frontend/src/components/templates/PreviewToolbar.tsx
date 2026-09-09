import type { ReactNode } from "react";

export type PreviewViewMode = "continuous" | "print";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;

interface PreviewToolbarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  viewMode: PreviewViewMode;
  onViewModeChange: (mode: PreviewViewMode) => void;
  pageCount: number;
}

function ZoomButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md text-sm text-ink-900/70 hover:bg-ink-900/[0.06] disabled:opacity-30 disabled:hover:bg-transparent dark:text-paper-50/70 dark:hover:bg-paper-50/10"
    >
      {children}
    </button>
  );
}

export function PreviewToolbar({ zoom, onZoomChange, viewMode, onViewModeChange, pageCount }: PreviewToolbarProps) {
  const clamp = (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/8 bg-white/80 px-3 py-2 backdrop-blur dark:border-paper-50/10 dark:bg-ink-900/80">
      <div className="flex items-center gap-1">
        <ZoomButton label="Zoom out" disabled={zoom <= ZOOM_MIN} onClick={() => onZoomChange(clamp(zoom - ZOOM_STEP))}>
          −
        </ZoomButton>
        <button
          type="button"
          onClick={() => onZoomChange(1)}
          title="Reset zoom to 100%"
          className="min-w-[3.25rem] rounded-md px-1.5 py-1 text-center text-xs font-medium text-ink-900/70 hover:bg-ink-900/[0.06] dark:text-paper-50/70 dark:hover:bg-paper-50/10"
        >
          {Math.round(zoom * 100)}%
        </button>
        <ZoomButton label="Zoom in" disabled={zoom >= ZOOM_MAX} onClick={() => onZoomChange(clamp(zoom + ZOOM_STEP))}>
          +
        </ZoomButton>
      </div>

      <div className="flex items-center gap-3">
        {pageCount > 1 && (
          <span className="text-xs text-ink-900/50 dark:text-paper-50/50">
            {pageCount} page{pageCount === 1 ? "" : "s"}
          </span>
        )}
        <div className="flex rounded-lg bg-ink-900/[0.05] p-0.5 text-xs dark:bg-paper-50/10">
          <button
            type="button"
            onClick={() => onViewModeChange("continuous")}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              viewMode === "continuous" ? "bg-white text-ink-950 shadow-sm dark:bg-ink-800 dark:text-paper-50" : "text-ink-900/55 dark:text-paper-50/55"
            }`}
          >
            Continuous
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("print")}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              viewMode === "print" ? "bg-white text-ink-950 shadow-sm dark:bg-ink-800 dark:text-paper-50" : "text-ink-900/55 dark:text-paper-50/55"
            }`}
          >
            Print preview
          </button>
        </div>
      </div>
    </div>
  );
}
