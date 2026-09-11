import type { ReactNode } from "react";
import {
  closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, type SortingStrategy,
} from "@dnd-kit/sortable";
import { moveItem } from "@/lib/reorderUtils";

interface Props<T extends { id: string }> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  renderItem: (item: T) => ReactNode;
  strategy?: SortingStrategy;
  className?: string;
  /** Container element - "ul" for a vertical list, "div" for a wrapping row of pills. */
  as?: "ul" | "div";
}

/**
 * Reusable drag-and-drop list: wires up DndContext + SortableContext once,
 * moves the dragged item on drop, and hands the reordered array back via
 * `onReorder` - callers decide what to do with it (optimistic update +
 * a reorder API call). A pointer-sensor activation distance avoids
 * hijacking ordinary clicks on nested Edit/Delete buttons or pill "x"
 * buttons before an intentional drag actually starts.
 */
export function SortableList<T extends { id: string }>({
  items, onReorder, renderItem, strategy = verticalListSortingStrategy, className, as: Tag = "ul",
}: Props<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = items.findIndex((item) => item.id === active.id);
    const toIndex = items.findIndex((item) => item.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;

    onReorder(moveItem(items, fromIndex, toIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={strategy}>
        <Tag className={className}>{items.map((item) => renderItem(item))}</Tag>
      </SortableContext>
    </DndContext>
  );
}
