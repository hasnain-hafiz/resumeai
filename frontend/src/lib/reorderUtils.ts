/**
 * Pure reordering logic, deliberately kept separate from the dnd-kit
 * `DndContext`/`useSortable` wiring (see SortableList.tsx) - same principle
 * as `pageMetrics.ts` vs `usePageCount()` in Feature 5: the actual math is
 * unit-testable without mocking pointer events or DOM measurement.
 */

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }
  const result = items.slice();
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

/** Reorders a list of `{ id }`-shaped items by moving `activeId` to where `overId` currently sits. */
export function reorderById<T extends { id: string }>(items: T[], activeId: string, overId: string): T[] {
  if (activeId === overId) return items;
  const fromIndex = items.findIndex((i) => i.id === activeId);
  const toIndex = items.findIndex((i) => i.id === overId);
  if (fromIndex === -1 || toIndex === -1) return items;
  return moveItem(items, fromIndex, toIndex);
}

/** Extracts just the ordered ids, for sending to a reorder API endpoint. */
export function idsOf<T extends { id: string }>(items: T[]): string[] {
  return items.map((i) => i.id);
}
