import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreviewToolbar } from "@/components/templates/PreviewToolbar";

describe("PreviewToolbar", () => {
  it("shows the current zoom as a whole-number percentage", () => {
    render(
      <PreviewToolbar zoom={0.8} onZoomChange={vi.fn()} viewMode="continuous" onViewModeChange={vi.fn()} pageCount={1} />
    );
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("zooming in increases zoom by one step", async () => {
    const user = userEvent.setup();
    const handleZoom = vi.fn();
    render(
      <PreviewToolbar zoom={0.8} onZoomChange={handleZoom} viewMode="continuous" onViewModeChange={vi.fn()} pageCount={1} />
    );

    await user.click(screen.getByLabelText("Zoom in"));

    expect(handleZoom).toHaveBeenCalledWith(0.9);
  });

  it("zooming out decreases zoom by one step", async () => {
    const user = userEvent.setup();
    const handleZoom = vi.fn();
    render(
      <PreviewToolbar zoom={0.8} onZoomChange={handleZoom} viewMode="continuous" onViewModeChange={vi.fn()} pageCount={1} />
    );

    await user.click(screen.getByLabelText("Zoom out"));

    expect(handleZoom).toHaveBeenCalledWith(0.7);
  });

  it("clicking the percentage resets zoom to 100%", async () => {
    const user = userEvent.setup();
    const handleZoom = vi.fn();
    render(
      <PreviewToolbar zoom={0.6} onZoomChange={handleZoom} viewMode="continuous" onViewModeChange={vi.fn()} pageCount={1} />
    );

    await user.click(screen.getByText("60%"));

    expect(handleZoom).toHaveBeenCalledWith(1);
  });

  it("disables zoom-in at the maximum and zoom-out at the minimum", () => {
    const { rerender } = render(
      <PreviewToolbar zoom={1.5} onZoomChange={vi.fn()} viewMode="continuous" onViewModeChange={vi.fn()} pageCount={1} />
    );
    expect(screen.getByLabelText("Zoom in")).toBeDisabled();

    rerender(<PreviewToolbar zoom={0.4} onZoomChange={vi.fn()} viewMode="continuous" onViewModeChange={vi.fn()} pageCount={1} />);
    expect(screen.getByLabelText("Zoom out")).toBeDisabled();
  });

  it("switches view mode when a toggle button is clicked", async () => {
    const user = userEvent.setup();
    const handleModeChange = vi.fn();
    render(
      <PreviewToolbar zoom={1} onZoomChange={vi.fn()} viewMode="continuous" onViewModeChange={handleModeChange} pageCount={1} />
    );

    await user.click(screen.getByRole("button", { name: "Print preview" }));

    expect(handleModeChange).toHaveBeenCalledWith("print");
  });

  it("shows the page count only when there is more than one page", () => {
    const { rerender } = render(
      <PreviewToolbar zoom={1} onZoomChange={vi.fn()} viewMode="continuous" onViewModeChange={vi.fn()} pageCount={1} />
    );
    expect(screen.queryByText(/^\d+ pages?$/)).not.toBeInTheDocument();

    rerender(<PreviewToolbar zoom={1} onZoomChange={vi.fn()} viewMode="continuous" onViewModeChange={vi.fn()} pageCount={3} />);
    expect(screen.getByText("3 pages")).toBeInTheDocument();
  });

  it("shows a Fit button only when onFitToScreen is provided, and calls it when clicked", async () => {
    const user = userEvent.setup();
    const handleFit = vi.fn();
    const { rerender } = render(
      <PreviewToolbar zoom={1} onZoomChange={vi.fn()} viewMode="continuous" onViewModeChange={vi.fn()} pageCount={1} />
    );
    expect(screen.queryByRole("button", { name: "Fit" })).not.toBeInTheDocument();

    rerender(
      <PreviewToolbar
        zoom={1}
        onZoomChange={vi.fn()}
        viewMode="continuous"
        onViewModeChange={vi.fn()}
        pageCount={1}
        onFitToScreen={handleFit}
      />
    );
    await user.click(screen.getByRole("button", { name: "Fit" }));
    expect(handleFit).toHaveBeenCalledTimes(1);
  });
});
