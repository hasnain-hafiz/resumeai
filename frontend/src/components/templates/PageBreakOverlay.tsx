import { A4_HEIGHT_MM } from "@/components/templates/pageMetrics";

interface PageBreakOverlayProps {
  pageCount: number;
}

/**
 * Purely visual - marks where content would actually split across printed
 * pages, without changing the underlying layout. Positioned in millimeters
 * (matching the page content it overlays) rather than the pixel constants in
 * pageMetrics, so it stays pixel-perfect if the browser's mm-to-px rounding
 * ever differs by a hair from our own MM_TO_PX constant.
 */
export function PageBreakOverlay({ pageCount }: PageBreakOverlayProps) {
  if (pageCount <= 1) return null;

  const breaks = Array.from({ length: pageCount - 1 }, (_, i) => i + 1);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {breaks.map((pageIndex) => (
        <div key={pageIndex} className="absolute left-0 right-0" style={{ top: `${pageIndex * A4_HEIGHT_MM}mm` }}>
          <div className="border-t-2 border-dashed border-danger/50" />
          <span className="absolute -top-2.5 right-2 rounded-full bg-danger px-2 py-0.5 text-[9px] font-medium text-white">
            Page {pageIndex + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
