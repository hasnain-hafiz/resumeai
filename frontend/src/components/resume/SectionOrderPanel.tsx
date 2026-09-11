import { SECTION_LABELS, type SectionKey } from "@/types/resume.types";
import { SortableList } from "@/components/resume/dnd/SortableList";
import { DragHandle, SortableItem } from "@/components/resume/dnd/SortableItem";

interface Props {
  sectionOrder: SectionKey[];
  onReorder: (newOrder: SectionKey[]) => void;
}

/**
 * Controls the order Experience/Education/Projects/... render in on the
 * actual resume (see templateSections.tsx). Summary always stays first, so
 * it isn't included here - only the sections a user might reasonably want
 * to promote or demote (e.g. Skills above Experience for a career-changer).
 */
export function SectionOrderPanel({ sectionOrder, onReorder }: Props) {
  const rows = sectionOrder.map((key) => ({ id: key, key }));

  return (
    <div className="rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card">
      <h3 className="mb-1 font-display text-lg text-ink-950 dark:text-paper-50">Section order</h3>
      <p className="mb-4 text-xs text-ink-900/50 dark:text-paper-50/50">
        Drag to change the order sections appear in on your resume. Your name and summary always stay at the top.
      </p>
      <SortableList
        items={rows}
        onReorder={(reordered) => onReorder(reordered.map((r) => r.key))}
        className="space-y-2"
        renderItem={(row) => (
          <SortableItem
            key={row.id} id={row.id}
            className="flex items-center gap-2 rounded-lg border border-ink-900/8 dark:border-paper-50/10 px-3 py-2.5"
          >
            <DragHandle />
            <span className="text-sm text-ink-900 dark:text-paper-50">{SECTION_LABELS[row.key]}</span>
          </SortableItem>
        )}
      />
    </div>
  );
}
