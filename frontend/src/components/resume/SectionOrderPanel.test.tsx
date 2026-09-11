import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionOrderPanel } from "@/components/resume/SectionOrderPanel";
import type { SectionKey } from "@/types/resume.types";

const ORDER: SectionKey[] = [
  "EXPERIENCE", "EDUCATION", "PROJECTS", "SKILLS", "CERTIFICATIONS",
  "AWARDS", "PUBLICATIONS", "VOLUNTEER", "REFERENCES", "CUSTOM_SECTIONS",
];

describe("SectionOrderPanel", () => {
  it("renders every section label in the given order", () => {
    render(<SectionOrderPanel sectionOrder={ORDER} onReorder={vi.fn()} />);

    const labels = screen.getAllByText(
      /Experience|Education|Projects|Skills|Certifications|Awards|Publications|Volunteer Experience|References|Custom Sections/
    );
    expect(labels.map((el) => el.textContent)).toEqual([
      "Experience", "Education", "Projects", "Skills", "Certifications",
      "Awards", "Publications", "Volunteer Experience", "References", "Custom Sections",
    ]);
  });

  it("renders a drag handle for each section", () => {
    render(<SectionOrderPanel sectionOrder={ORDER} onReorder={vi.fn()} />);
    expect(screen.getAllByLabelText("Drag to reorder")).toHaveLength(ORDER.length);
  });

  it("mentions that name/summary stay fixed at the top", () => {
    render(<SectionOrderPanel sectionOrder={ORDER} onReorder={vi.fn()} />);
    expect(screen.getByText(/always stay at the top/i)).toBeInTheDocument();
  });
});
