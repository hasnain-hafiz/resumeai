import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SortableList } from "@/components/resume/dnd/SortableList";
import { DragHandle, SortableItem } from "@/components/resume/dnd/SortableItem";

interface Row {
  id: string;
  label: string;
}

const ROWS: Row[] = [
  { id: "1", label: "First" },
  { id: "2", label: "Second" },
  { id: "3", label: "Third" },
];

function renderRows(rows: Row[], onReorder = vi.fn()) {
  return render(
    <SortableList
      items={rows}
      onReorder={onReorder}
      renderItem={(row) => (
        <SortableItem key={row.id} id={row.id} className="row">
          <DragHandle />
          <span>{row.label}</span>
        </SortableItem>
      )}
    />
  );
}

describe("SortableList", () => {
  it("renders every item via renderItem", () => {
    renderRows(ROWS);

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it("renders a drag handle for each item", () => {
    renderRows(ROWS);
    expect(screen.getAllByLabelText("Drag to reorder")).toHaveLength(3);
  });

  it("renders nothing but the container for an empty list", () => {
    const { container } = renderRows([]);
    expect(container.querySelector("ul")).toBeEmptyDOMElement();
  });

  it("preserves render order (drag interactions are covered by reorderUtils.test.ts)", () => {
    renderRows(ROWS);
    const labels = screen.getAllByText(/First|Second|Third/).map((el) => el.textContent);
    expect(labels).toEqual(["First", "Second", "Third"]);
  });
});
