import { createContext, useContext, type ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type UseSortableResult = ReturnType<typeof useSortable>;

interface SortableItemContextValue {
  attributes: UseSortableResult["attributes"];
  listeners: UseSortableResult["listeners"];
  isDragging: boolean;
}

const SortableItemContext = createContext<SortableItemContextValue | null>(null);

/**
 * One draggable row/pill in a SortableList. Wraps `useSortable` and exposes
 * its attributes/listeners via context so a <DragHandle /> rendered anywhere
 * inside it can pick them up - keeps the drag affordance a small, explicit
 * icon rather than making the whole row (with its Edit/Delete buttons)
 * a drag target.
 */
export function SortableItem({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <SortableItemContext.Provider value={{ attributes, listeners, isDragging }}>
      <div ref={setNodeRef} style={style} className={className}>
        {children}
      </div>
    </SortableItemContext.Provider>
  );
}

/** Drag affordance - must be rendered somewhere inside a <SortableItem>. */
export function DragHandle({ className, label = "Drag to reorder" }: { className?: string; label?: string }) {
  const ctx = useContext(SortableItemContext);

  return (
    <button
      type="button"
      aria-label={label}
      className={
        className ??
        "shrink-0 cursor-grab touch-none text-ink-900/30 hover:text-ink-900/60 active:cursor-grabbing dark:text-paper-50/30 dark:hover:text-paper-50/60"
      }
      {...(ctx?.attributes ?? {})}
      {...(ctx?.listeners ?? {})}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="3" r="1.3" />
        <circle cx="11" cy="3" r="1.3" />
        <circle cx="5" cy="8" r="1.3" />
        <circle cx="11" cy="8" r="1.3" />
        <circle cx="5" cy="13" r="1.3" />
        <circle cx="11" cy="13" r="1.3" />
      </svg>
    </button>
  );
}
