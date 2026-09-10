import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageBreakOverlay } from "@/components/templates/PageBreakOverlay";

describe("PageBreakOverlay", () => {
  it("renders nothing for a single-page resume", () => {
    const { container } = render(<PageBreakOverlay pageCount={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one break marker for a two-page resume, labelled 'Page 2'", () => {
    render(<PageBreakOverlay pageCount={2} />);
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(screen.queryByText("Page 3")).not.toBeInTheDocument();
  });

  it("renders a marker for every page boundary on a longer resume", () => {
    render(<PageBreakOverlay pageCount={4} />);
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(screen.getByText("Page 3")).toBeInTheDocument();
    expect(screen.getByText("Page 4")).toBeInTheDocument();
  });

  it("is purely decorative - hidden from assistive tech and ignores pointer events", () => {
    const { container } = render(<PageBreakOverlay pageCount={2} />);
    const overlay = container.firstElementChild as HTMLElement;
    expect(overlay).toHaveAttribute("aria-hidden", "true");
    expect(overlay.className).toContain("pointer-events-none");
  });
});
