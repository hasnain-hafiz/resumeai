import { useState, type FormEvent } from "react";
import type { CustomSection, CustomSectionItem } from "@/types/resume.types";

type ItemForm = { heading: string; subheading: string; description: string; startDate: string; endDate: string; sortOrder: number };

function emptyItemForm(): ItemForm {
  return { heading: "", subheading: "", description: "", startDate: "", endDate: "", sortOrder: 0 };
}

interface Props {
  sections: CustomSection[];
  onAddSection: (title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string, form: ItemForm) => void;
  onDeleteItem: (sectionId: string, itemId: string) => void;
}

function SectionCard({ section, onDeleteSection, onAddItem, onDeleteItem }: {
  section: CustomSection; onDeleteSection: (id: string) => void; onAddItem: Props["onAddItem"]; onDeleteItem: Props["onDeleteItem"];
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ItemForm>(emptyItemForm());

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onAddItem(section.id, form);
    setForm(emptyItemForm());
    setAdding(false);
  };

  return (
    <div className="rounded-lg border border-ink-900/8 dark:border-paper-50/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-ink-900 dark:text-paper-50">{section.title}</p>
        <button onClick={() => onDeleteSection(section.id)} className="text-xs font-medium text-danger hover:text-danger/80">
          Delete section
        </button>
      </div>

      {section.items.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {section.items.map((item: CustomSectionItem) => (
            <li key={item.id} className="flex items-start justify-between gap-2 rounded-md bg-ink-900/[0.03] dark:bg-paper-50/5 px-2.5 py-1.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-ink-900 dark:text-paper-50">{item.heading}</p>
                {item.subheading && <p className="truncate text-xs text-ink-900/50 dark:text-paper-50/50">{item.subheading}</p>}
              </div>
              <button onClick={() => onDeleteItem(section.id, item.id)} className="shrink-0 text-xs text-danger hover:text-danger/80">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {!adding ? (
        <button onClick={() => setAdding(true)} className="text-xs font-medium text-accent hover:text-accent-hover">
          + Add item
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <input
            required
            placeholder="Heading"
            value={form.heading}
            onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))}
            className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-2.5 py-1.5 text-xs text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30"
          />
          <input
            placeholder="Subheading (optional)"
            value={form.subheading}
            onChange={(e) => setForm((f) => ({ ...f, subheading: e.target.value }))}
            className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-2.5 py-1.5 text-xs text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30"
          />
          <textarea
            placeholder="Description (optional)"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-2.5 py-1.5 text-xs text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30"
          />
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-hover">Add</button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-lg px-3 py-1 text-xs font-medium text-ink-900/60 dark:text-paper-50/60">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

export function CustomSectionsEditor({ sections, onAddSection, onDeleteSection, onAddItem, onDeleteItem }: Props) {
  const [newSectionTitle, setNewSectionTitle] = useState("");

  return (
    <div className="rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card">
      <h3 className="mb-1 font-display text-lg text-ink-950 dark:text-paper-50">Custom sections</h3>
      <p className="mb-4 text-xs text-ink-900/50 dark:text-paper-50/50">
        Anything the built-in sections don't cover - talks, patents, hackathons, and so on.
      </p>

      <div className="space-y-3 mb-4">
        {sections.map((section) => (
          <SectionCard key={section.id} section={section} onDeleteSection={onDeleteSection} onAddItem={onAddItem} onDeleteItem={onDeleteItem} />
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder="New section title, e.g. Patents"
          className="flex-1 rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-1.5 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        <button
          onClick={() => { if (newSectionTitle.trim()) { onAddSection(newSectionTitle.trim()); setNewSectionTitle(""); } }}
          className="rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft/70 dark:bg-accent/15"
        >
          + Add section
        </button>
      </div>
    </div>
  );
}
