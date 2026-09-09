import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Project } from "@/types/resume.types";

type ProjectForm = { title: string; description: string; technologies: string; githubUrl: string; liveUrl: string; sortOrder: number };

function emptyForm(): ProjectForm {
  return { title: "", description: "", technologies: "", githubUrl: "", liveUrl: "", sortOrder: 0 };
}

interface Props {
  items: Project[];
  onAdd: (form: ProjectForm) => void;
  onUpdate: (id: string, form: ProjectForm) => void;
  onDelete: (id: string) => void;
  onAddImage: (projectId: string, url: string) => void;
  onDeleteImage: (projectId: string, imageId: string) => void;
  isSaving?: boolean;
  /** See GenericListSection's onDraftItems - same "unsaved form state, live" contract. */
  onDraftItems?: (items: Project[] | undefined) => void;
}

export function ProjectsSection({ items, onAdd, onUpdate, onDelete, onAddImage, onDeleteImage, isSaving, onDraftItems }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ProjectForm>(emptyForm());
  const [imageUrlDraft, setImageUrlDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!onDraftItems) return;
    if (adding) {
      onDraftItems([...items, { id: "__draft_new__", ...form, images: [] }]);
    } else if (editingId) {
      onDraftItems(items.map((item) => (item.id === editingId ? { ...item, ...form } : item)));
    } else {
      onDraftItems(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, adding, editingId, items]);

  const onDraftItemsRef = useRef(onDraftItems);
  onDraftItemsRef.current = onDraftItems;
  useEffect(() => () => onDraftItemsRef.current?.(undefined), []);

  const startAdd = () => { setForm(emptyForm()); setAdding(true); setEditingId(null); };
  const startEdit = (item: Project) => {
    setForm({
      title: item.title, description: item.description ?? "", technologies: item.technologies ?? "",
      githubUrl: item.githubUrl ?? "", liveUrl: item.liveUrl ?? "", sortOrder: item.sortOrder,
    });
    setEditingId(item.id);
    setAdding(false);
  };
  const cancel = () => { setAdding(false); setEditingId(null); };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (adding) onAdd(form);
    else if (editingId) onUpdate(editingId, form);
    cancel();
  };

  const showForm = adding || editingId !== null;

  return (
    <div className="rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg text-ink-950 dark:text-paper-50">Projects</h3>
        {!showForm && (
          <button onClick={startAdd} className="rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft/70 dark:bg-accent/15">
            + Add
          </button>
        )}
      </div>

      {!showForm && items.length === 0 && (
        <p className="py-4 text-center text-sm text-ink-900/45 dark:text-paper-50/45">No projects added yet.</p>
      )}

      {!showForm && items.length > 0 && (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-ink-900/8 dark:border-paper-50/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 dark:text-paper-50">{item.title}</p>
                  {item.technologies && <p className="text-xs text-ink-900/50 dark:text-paper-50/50">{item.technologies}</p>}
                </div>
                <div className="flex shrink-0 gap-3 text-xs">
                  <button onClick={() => startEdit(item)} className="font-medium text-accent hover:text-accent-hover">Edit</button>
                  <button onClick={() => onDelete(item.id)} className="font-medium text-danger hover:text-danger/80">Delete</button>
                </div>
              </div>

              {/* Image URLs - actual file upload belongs to the Storage/Cloudinary feature; for now, paste a hosted URL. */}
              <div className="mt-3 border-t border-ink-900/8 dark:border-paper-50/10 pt-3">
                <p className="mb-2 text-xs font-medium text-ink-900/60 dark:text-paper-50/60">Images</p>
                {item.images.length > 0 && (
                  <ul className="mb-2 space-y-1">
                    {item.images.map((img) => (
                      <li key={img.id} className="flex items-center justify-between gap-2 text-xs text-ink-900/70 dark:text-paper-50/70">
                        <span className="truncate">{img.url}</span>
                        <button onClick={() => onDeleteImage(item.id, img.id)} className="shrink-0 text-danger hover:text-danger/80">
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrlDraft[item.id] ?? ""}
                    onChange={(e) => setImageUrlDraft((d) => ({ ...d, [item.id]: e.target.value }))}
                    className="flex-1 rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-2.5 py-1.5 text-xs text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                  <button
                    onClick={() => {
                      const url = imageUrlDraft[item.id];
                      if (url) {
                        onAddImage(item.id, url);
                        setImageUrlDraft((d) => ({ ...d, [item.id]: "" }));
                      }
                    }}
                    className="rounded-lg bg-ink-900/[0.06] dark:bg-paper-50/10 px-3 py-1.5 text-xs font-medium text-ink-900 dark:text-paper-50 hover:bg-ink-900/10"
                  >
                    Add
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Title" required value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
          <Textarea label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
          <Input label="Technologies (comma-separated)" value={form.technologies} onChange={(v) => setForm((f) => ({ ...f, technologies: v }))} placeholder="React, Node.js, PostgreSQL" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="GitHub URL" type="url" value={form.githubUrl} onChange={(v) => setForm((f) => ({ ...f, githubUrl: v }))} />
            <Input label="Live URL" type="url" value={form.liveUrl} onChange={(v) => setForm((f) => ({ ...f, liveUrl: v }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isSaving} className="rounded-lg bg-accent px-3.5 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60">
              {adding ? "Add" : "Save"}
            </button>
            <button type="button" onClick={cancel} className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-ink-900/60 hover:bg-ink-900/[0.04] dark:text-paper-50/60 dark:hover:bg-paper-50/5">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-900/70 dark:text-paper-50/70">{label}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
    </div>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-900/70 dark:text-paper-50/70">{label}</label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
    </div>
  );
}
