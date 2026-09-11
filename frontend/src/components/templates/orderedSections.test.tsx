import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { orderedSections } from "@/components/templates/templateSections";

function renderOrder(sectionOrder: string[] | null | undefined, keys: string[]) {
  const blocks = Object.fromEntries(keys.map((k) => [k, <span key={k}>{k}</span>]));
  return render(<>{orderedSections(sectionOrder, blocks)}</>);
}

describe("orderedSections", () => {
  it("renders blocks in the given order", () => {
    renderOrder(["SKILLS", "EXPERIENCE", "EDUCATION"], ["EXPERIENCE", "EDUCATION", "SKILLS"]);
    const labels = screen.getAllByText(/SKILLS|EXPERIENCE|EDUCATION/).map((el) => el.textContent);
    expect(labels).toEqual(["SKILLS", "EXPERIENCE", "EDUCATION"]);
  });

  it("skips keys in the order that have no corresponding block (e.g. SKILLS pinned to a sidebar elsewhere)", () => {
    renderOrder(["SKILLS", "EXPERIENCE", "EDUCATION"], ["EXPERIENCE", "EDUCATION"]);
    const labels = screen.getAllByText(/EXPERIENCE|EDUCATION/).map((el) => el.textContent);
    expect(labels).toEqual(["EXPERIENCE", "EDUCATION"]);
    expect(screen.queryByText("SKILLS")).not.toBeInTheDocument();
  });

  it("appends a block whose key is missing from sectionOrder, rather than dropping it", () => {
    renderOrder(["EXPERIENCE"], ["EXPERIENCE", "EDUCATION"]);
    const labels = screen.getAllByText(/EXPERIENCE|EDUCATION/).map((el) => el.textContent);
    expect(labels).toEqual(["EXPERIENCE", "EDUCATION"]);
  });

  it("falls back to the blocks' own key order when sectionOrder is empty", () => {
    renderOrder([], ["PROJECTS", "EXPERIENCE"]);
    const labels = screen.getAllByText(/PROJECTS|EXPERIENCE/).map((el) => el.textContent);
    expect(labels).toEqual(["PROJECTS", "EXPERIENCE"]);
  });

  it("falls back to the blocks' own key order when sectionOrder is null", () => {
    renderOrder(null, ["PROJECTS", "EXPERIENCE"]);
    const labels = screen.getAllByText(/PROJECTS|EXPERIENCE/).map((el) => el.textContent);
    expect(labels).toEqual(["PROJECTS", "EXPERIENCE"]);
  });

  it("ignores a duplicated key in sectionOrder", () => {
    renderOrder(["EXPERIENCE", "EXPERIENCE", "EDUCATION"], ["EXPERIENCE", "EDUCATION"]);
    const labels = screen.getAllByText(/EXPERIENCE|EDUCATION/).map((el) => el.textContent);
    expect(labels).toEqual(["EXPERIENCE", "EDUCATION"]);
  });
});
