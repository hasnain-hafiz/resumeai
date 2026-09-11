import { describe, expect, it } from "vitest";
import { idsOf, moveItem, reorderById } from "@/lib/reorderUtils";

describe("moveItem", () => {
  it("moves an item from one index to another", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("moves an item backward", () => {
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("is a no-op when fromIndex equals toIndex", () => {
    const items = ["a", "b", "c"];
    expect(moveItem(items, 1, 1)).toBe(items);
  });

  it("is a no-op for an out-of-range fromIndex", () => {
    const items = ["a", "b"];
    expect(moveItem(items, 5, 0)).toBe(items);
  });

  it("is a no-op for an out-of-range toIndex", () => {
    const items = ["a", "b"];
    expect(moveItem(items, 0, 5)).toBe(items);
  });

  it("is a no-op for a negative index", () => {
    const items = ["a", "b"];
    expect(moveItem(items, -1, 0)).toBe(items);
  });

  it("handles a single-item list", () => {
    const items = ["only"];
    expect(moveItem(items, 0, 0)).toBe(items);
  });

  it("does not mutate the original array", () => {
    const items = ["a", "b", "c"];
    moveItem(items, 0, 2);
    expect(items).toEqual(["a", "b", "c"]);
  });
});

describe("reorderById", () => {
  const items = [{ id: "1" }, { id: "2" }, { id: "3" }];

  it("moves the active item to the over item's position", () => {
    expect(reorderById(items, "1", "3")).toEqual([{ id: "2" }, { id: "3" }, { id: "1" }]);
  });

  it("is a no-op when active and over are the same id", () => {
    expect(reorderById(items, "2", "2")).toBe(items);
  });

  it("is a no-op when the active id is not found", () => {
    expect(reorderById(items, "missing", "2")).toBe(items);
  });

  it("is a no-op when the over id is not found", () => {
    expect(reorderById(items, "2", "missing")).toBe(items);
  });
});

describe("idsOf", () => {
  it("extracts ids in order", () => {
    expect(idsOf([{ id: "a" }, { id: "b" }])).toEqual(["a", "b"]);
  });

  it("returns an empty array for an empty list", () => {
    expect(idsOf([])).toEqual([]);
  });
});
