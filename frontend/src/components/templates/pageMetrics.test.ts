import { describe, expect, it } from "vitest";
import { A4_HEIGHT_PX, calculatePageCount } from "@/components/templates/pageMetrics";

describe("calculatePageCount", () => {
  it("returns 1 page for content shorter than one page height", () => {
    expect(calculatePageCount(500, 1000)).toBe(1);
  });

  it("returns 1 page for content exactly one page height", () => {
    expect(calculatePageCount(1000, 1000)).toBe(1);
  });

  it("returns 2 pages for content just over one page height", () => {
    expect(calculatePageCount(1001, 1000)).toBe(2);
  });

  it("returns 2 pages for content exactly two page heights", () => {
    expect(calculatePageCount(2000, 1000)).toBe(2);
  });

  it("rounds up partial extra pages", () => {
    expect(calculatePageCount(2100, 1000)).toBe(3);
  });

  it("never returns less than 1, even for zero or negative height", () => {
    expect(calculatePageCount(0, 1000)).toBe(1);
    expect(calculatePageCount(-50, 1000)).toBe(1);
  });

  it("defaults to the real A4 page height in pixels when none is given", () => {
    expect(calculatePageCount(A4_HEIGHT_PX)).toBe(1);
    expect(calculatePageCount(A4_HEIGHT_PX + 1)).toBe(2);
  });

  it("falls back to 1 page for a degenerate (zero) page height rather than dividing by zero", () => {
    expect(calculatePageCount(500, 0)).toBe(1);
  });
});
