import { type RefObject, useEffect, useState } from "react";

// CSS defines 1in = 96px and 1in = 25.4mm, so this ratio is spec-guaranteed
// (not a measured/approximate value) and holds regardless of browser, zoom,
// or OS display scaling - CSS px is a fixed physical-ish unit by definition.
export const MM_TO_PX = 96 / 25.4;
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const A4_WIDTH_PX = A4_WIDTH_MM * MM_TO_PX;
export const A4_HEIGHT_PX = A4_HEIGHT_MM * MM_TO_PX;

/** Pure function, kept separate from the DOM-observing hook below so it's trivially unit-testable. */
export function calculatePageCount(contentHeightPx: number, pageHeightPx: number = A4_HEIGHT_PX): number {
  if (pageHeightPx <= 0) return 1;
  return Math.max(1, Math.ceil(contentHeightPx / pageHeightPx));
}

/**
 * Watches a ref'd element's rendered height and returns how many A4 pages it
 * would span when printed. Uses ResizeObserver so it stays correct as the
 * user edits (content grows/shrinks) without any manual recalculation calls.
 *
 * Note: CSS `transform: scale(...)` (used for zoom) does NOT affect
 * `scrollHeight` - it's a paint-time transform, not a layout change - so this
 * hook returns the same page count regardless of the current zoom level,
 * which is the correct behavior (zooming shouldn't change how many pages the
 * resume actually has).
 */
export function usePageCount(ref: RefObject<HTMLElement | null>, deps: unknown[] = []): number {
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => setPageCount(calculatePageCount(element.scrollHeight));
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return pageCount;
}
