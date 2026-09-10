import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { createElement, useRef } from "react";
import { A4_HEIGHT_PX, A4_WIDTH_PX, calculatePageCount, useMeasuredSize } from "@/components/templates/pageMetrics";

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

describe("useMeasuredSize", () => {
  it("defaults to the A4 page size before anything has been measured (e.g. ref not yet attached)", () => {
    let measured: { width: number; height: number } | undefined;

    function Probe() {
      measured = useMeasuredSize({ current: null });
      return null;
    }

    render(createElement(Probe));

    expect(measured).toEqual({ width: A4_WIDTH_PX, height: A4_HEIGHT_PX });
  });

  it("measures the mounted element's own box size once attached", () => {
    let measured: { width: number; height: number } | undefined;

    function Probe() {
      const ref = useRef<HTMLDivElement>(null);
      measured = useMeasuredSize(ref);
      return createElement("div", { ref });
    }

    render(createElement(Probe));

    // Real measurement took over from the A4 default - jsdom reports 0x0 for
    // layout, which is exactly the point: it's actually reading the element,
    // not just returning the static fallback forever.
    expect(measured).toEqual({ width: 0, height: 0 });
  });
});
