import { useEffect, useRef, useState, type FormEvent } from "react";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "url" | "email" | "number";
  required?: boolean;
  placeholder?: string;
}

interface GenericListSectionProps<T extends { id: string; sortOrder: number }> {
  title: string;
  description?: string;
  fields: FieldConfig[];
  items: T[];
  titleField: keyof T;
  subtitleField?: keyof T;
  onAdd: (values: Record<string, string>) => void;
  onUpdate: (id: string, values: Record<string, string>) => void;
  onDelete: (id: string) => void;
  isSaving?: boolean;
  /**
   * Reports the list as it would look with the in-progress add/edit form
   * merged in (or `undefined` when there's no unsaved edit), on every
   * keystroke - lets a parent feed this straight into the live preview
   * without waiting for the add/update mutation to round-trip and refetch.
   * No API calls are made here; this is purely local, unsaved form state.
   */
  onDraftItems?: (items: T[] | undefined) => void;
}

function emptyValues(fields: FieldConfig[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.name, ""]));
}

function valuesFromItem<T>(item: T, fields: FieldConfig[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.name, String((item as Record<string, unknown>)[f.name] ?? "")]));
}

export function GenericListSection<T extends { id: string; sortOrder: number }>({
  title,
  description,
  fields,
  items,
  titleField,
  subtitleField,
  onAdd,
  onUpdate,
  onDelete,
  isSaving,
  onDraftItems,
}: GenericListSectionProps<T>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>(emptyValues(fields));

  // Live-preview draft reporting: while a field is being typed into (add or
  // edit), tell the parent what the list would look like with that unsaved
  // value merged in, so the preview updates instantly instead of waiting for
  // the Add/Save button's mutation to complete and the resume to refetch.
  useEffect(() => {
    if (!onDraftItems) return;
    if (adding) {
      const draftItem = { sortOrder: items.length, ...formValues, id: "__draft_new__" } as unknown as T;
      onDraftItems([...items, draftItem]);
    } else if (editingId) {
      onDraftItems(items.map((item) => (item.id === editingId ? ({ ...item, ...formValues } as T) : item)));
    } else {
      onDraftItems(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues, adding, editingId, items]);

  // Clear any leftover draft override if this section unmounts (e.g. the
  // user switches tabs) mid-edit without saving or cancelling.
  const onDraftItemsRef = useRef(onDraftItems);
  onDraftItemsRef.current = onDraftItems;
  useEffect(() => () => onDraftItemsRef.current?.(undefined), []);

  const startAdd = () => {
    setFormValues(emptyValues(fields));
    setAdding(true);
    setEditingId(null);
  };

  const startEdit = (item: T) => {
    setFormValues(valuesFromItem(item, fields));
    setEditingId(item.id);
    setAdding(false);
  };

  const cancel = () => {
    setAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (adding) {
      onAdd(formValues);
    } else if (editingId) {
      onUpdate(editingId, formValues);
    }
    cancel();
  };

  const showForm = adding || editingId !== null;

  return (
    <div className="rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg text-ink-950 dark:text-paper-50">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-ink-900/50 dark:text-paper-50/50">{description}</p>}
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={startAdd}
            className="shrink-0 rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft/70 dark:bg-accent/15"
          >
            + Add
          </button>
        )}
      </div>

      {!showForm && items.length === 0 && (
        <p className="py-4 text-center text-sm text-ink-900/45 dark:text-paper-50/45">Nothing added yet.</p>
      )}

      {!showForm && items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-ink-900/[0.03] dark:hover:bg-paper-50/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900 dark:text-paper-50">
                  {String(item[titleField] ?? "")}
                </p>
                {subtitleField && (
                  <p className="truncate text-xs text-ink-900/50 dark:text-paper-50/50">
                    {String(item[subtitleField] ?? "")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-3 text-xs">
                <button type="button" onClick={() => startEdit(item)} className="font-medium text-accent hover:text-accent-hover">
                  Edit
                </button>
                <button type="button" onClick={() => onDelete(item.id)} className="font-medium text-danger hover:text-danger/80">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map((field) => {
            const fieldId = `${title.replace(/\s+/g, "-").toLowerCase()}-${field.name}`;
            return (
              <div key={field.name}>
                <label htmlFor={fieldId} className="mb-1 block text-xs font-medium text-ink-900/70 dark:text-paper-50/70">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={fieldId}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={formValues[field.name] ?? ""}
                    onChange={(e) => setFormValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                ) : (
                  <input
                    id={fieldId}
                    type={field.type}
                    step={field.type === "number" ? "0.01" : undefined}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={formValues[field.name] ?? ""}
                    onChange={(e) => setFormValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                )}
              </div>
            );
          })}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {adding ? "Add" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-ink-900/60 hover:bg-ink-900/[0.04] dark:text-paper-50/60 dark:hover:bg-paper-50/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
