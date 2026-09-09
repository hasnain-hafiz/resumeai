import { useEffect, useRef, useState, type FormEvent } from "react";
import type { EmploymentType, Experience } from "@/types/resume.types";

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
  INTERNSHIP: "Internship",
  VOLUNTEER: "Volunteer",
};

type ExperienceForm = Omit<Experience, "id">;

function emptyForm(): ExperienceForm {
  return {
    company: "", position: "", location: "", employmentType: null,
    startDate: "", endDate: "", current: false, responsibilities: "", achievements: "", sortOrder: 0,
  };
}

function formatRange(exp: Experience): string {
  const start = exp.startDate ?? "?";
  const end = exp.current ? "Present" : exp.endDate ?? "?";
  return `${start} - ${end}`;
}

interface Props {
  items: Experience[];
  onAdd: (form: ExperienceForm) => void;
  onUpdate: (id: string, form: ExperienceForm) => void;
  onDelete: (id: string) => void;
  isSaving?: boolean;
  /** See GenericListSection's onDraftItems - same "unsaved form state, live" contract. */
  onDraftItems?: (items: Experience[] | undefined) => void;
}

export function ExperienceSection({ items, onAdd, onUpdate, onDelete, isSaving, onDraftItems }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ExperienceForm>(emptyForm());

  useEffect(() => {
    if (!onDraftItems) return;
    if (adding) {
      onDraftItems([...items, { id: "__draft_new__", ...form }]);
    } else if (editingId) {
      onDraftItems(items.map((item) => (item.id === editingId ? { id: item.id, ...form } : item)));
    } else {
      onDraftItems(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, adding, editingId, items]);

  const onDraftItemsRef = useRef(onDraftItems);
  onDraftItemsRef.current = onDraftItems;
  useEffect(() => () => onDraftItemsRef.current?.(undefined), []);

  const startAdd = () => { setForm(emptyForm()); setAdding(true); setEditingId(null); };
  const startEdit = (item: Experience) => {
    const { id, ...rest } = item;
    void id;
    setForm({ ...rest, startDate: rest.startDate ?? "", endDate: rest.endDate ?? "" });
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
        <h3 className="font-display text-lg text-ink-950 dark:text-paper-50">Experience</h3>
        {!showForm && (
          <button onClick={startAdd} className="rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft/70 dark:bg-accent/15">
            + Add
          </button>
        )}
      </div>

      {!showForm && items.length === 0 && (
        <p className="py-4 text-center text-sm text-ink-900/45 dark:text-paper-50/45">No experience added yet.</p>
      )}

      {!showForm && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-ink-900/8 dark:border-paper-50/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 dark:text-paper-50">{item.position} · {item.company}</p>
                  <p className="text-xs text-ink-900/50 dark:text-paper-50/50">
                    {formatRange(item)}{item.location ? ` · ${item.location}` : ""}
                    {item.employmentType ? ` · ${EMPLOYMENT_TYPE_LABELS[item.employmentType]}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3 text-xs">
                  <button onClick={() => startEdit(item)} className="font-medium text-accent hover:text-accent-hover">Edit</button>
                  <button onClick={() => onDelete(item.id)} className="font-medium text-danger hover:text-danger/80">Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Company" required value={form.company} onChange={(v) => setForm((f) => ({ ...f, company: v }))} />
            <Input label="Position" required value={form.position} onChange={(v) => setForm((f) => ({ ...f, position: v }))} />
            <Input label="Location" value={form.location ?? ""} onChange={(v) => setForm((f) => ({ ...f, location: v }))} />
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-900/70 dark:text-paper-50/70">Employment type</label>
              <select
                value={form.employmentType ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, employmentType: (e.target.value || null) as EmploymentType | null }))}
                className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              >
                <option value="">Select...</option>
                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <Input label="Start date" type="date" value={form.startDate ?? ""} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} />
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-900/70 dark:text-paper-50/70">End date</label>
              <input
                type="date"
                disabled={form.current}
                value={form.endDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:opacity-50"
              />
              <label className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-900/60 dark:text-paper-50/60">
                <input
                  type="checkbox"
                  checked={form.current}
                  onChange={(e) => setForm((f) => ({ ...f, current: e.target.checked, endDate: e.target.checked ? "" : f.endDate }))}
                />
                I currently work here
              </label>
            </div>
          </div>
          <Textarea label="Responsibilities" value={form.responsibilities ?? ""} onChange={(v) => setForm((f) => ({ ...f, responsibilities: v }))} />
          <Textarea label="Achievements" value={form.achievements ?? ""} onChange={(v) => setForm((f) => ({ ...f, achievements: v }))} />
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

function Input({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-900/70 dark:text-paper-50/70">{label}</label>
      <input
        type={type}
        required={required}
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
