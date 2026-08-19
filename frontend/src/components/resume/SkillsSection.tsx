import { useState, type KeyboardEvent } from "react";
import type { ListItem, ListItemSection, Proficiency } from "@/types/resume.types";

const SKILL_GROUPS: { section: ListItemSection; label: string }[] = [
  { section: "TECHNICAL_SKILL", label: "Technical skills" },
  { section: "SOFT_SKILL", label: "Soft skills" },
  { section: "TOOL", label: "Tools" },
  { section: "FRAMEWORK", label: "Frameworks" },
  { section: "DATABASE", label: "Databases" },
  { section: "PROGRAMMING_LANGUAGE", label: "Programming languages" },
  { section: "INTEREST", label: "Interests" },
];

const PROFICIENCIES: Proficiency[] = ["BASIC", "CONVERSATIONAL", "PROFESSIONAL", "FLUENT", "NATIVE"];

interface Props {
  items: ListItem[];
  onAdd: (section: ListItemSection, value: string, proficiency: Proficiency | null) => void;
  onDelete: (id: string) => void;
}

function TagGroup({ label, section, items, onAdd, onDelete }: { label: string; section: ListItemSection; items: ListItem[]; onAdd: Props["onAdd"]; onDelete: Props["onDelete"] }) {
  const [draft, setDraft] = useState("");
  const groupItems = items.filter((i) => i.section === section);

  const submit = () => {
    const value = draft.trim();
    if (value) {
      onAdd(section, value, null);
      setDraft("");
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
  };

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-900/60 dark:text-paper-50/60">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {groupItems.map((item) => (
          <span key={item.id} className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft dark:bg-accent/15 px-2.5 py-1 text-xs text-accent">
            {item.value}
            <button onClick={() => onDelete(item.id)} aria-label={`Remove ${item.value}`} className="text-accent/60 hover:text-accent">
              ×
            </button>
          </span>
        ))}
        {groupItems.length === 0 && <span className="text-xs text-ink-900/35 dark:text-paper-50/35">None added</span>}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={submit}
        placeholder="Type and press Enter..."
        className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-1.5 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
    </div>
  );
}

function LanguageGroup({ items, onAdd, onDelete }: { items: ListItem[]; onAdd: Props["onAdd"]; onDelete: Props["onDelete"] }) {
  const [value, setValue] = useState("");
  const [proficiency, setProficiency] = useState<Proficiency>("PROFESSIONAL");
  const languages = items.filter((i) => i.section === "SPOKEN_LANGUAGE");

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-900/60 dark:text-paper-50/60">Spoken languages</p>
      <ul className="mb-2 space-y-1">
        {languages.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-lg bg-ink-900/[0.03] dark:bg-paper-50/5 px-2.5 py-1.5 text-xs">
            <span className="text-ink-900 dark:text-paper-50">{item.value} <span className="text-ink-900/45 dark:text-paper-50/45">· {item.proficiency}</span></span>
            <button onClick={() => onDelete(item.id)} className="text-danger hover:text-danger/80">Remove</button>
          </li>
        ))}
        {languages.length === 0 && <li className="text-xs text-ink-900/35 dark:text-paper-50/35">None added</li>}
      </ul>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Spanish"
          className="flex-1 rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-1.5 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        <select
          value={proficiency}
          onChange={(e) => setProficiency(e.target.value as Proficiency)}
          className="rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-2 py-1.5 text-xs text-ink-950 dark:text-paper-50 outline-none"
        >
          {PROFICIENCIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button
          onClick={() => { if (value.trim()) { onAdd("SPOKEN_LANGUAGE", value.trim(), proficiency); setValue(""); } }}
          className="rounded-lg bg-ink-900/[0.06] dark:bg-paper-50/10 px-3 py-1.5 text-xs font-medium text-ink-900 dark:text-paper-50 hover:bg-ink-900/10"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export function SkillsSection({ items, onAdd, onDelete }: Props) {
  return (
    <div className="rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card">
      <h3 className="mb-1 font-display text-lg text-ink-950 dark:text-paper-50">Skills, interests & languages</h3>
      <p className="mb-4 text-xs text-ink-900/50 dark:text-paper-50/50">Press Enter to add a tag.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        {SKILL_GROUPS.map((group) => (
          <TagGroup key={group.section} label={group.label} section={group.section} items={items} onAdd={onAdd} onDelete={onDelete} />
        ))}
        <LanguageGroup items={items} onAdd={onAdd} onDelete={onDelete} />
      </div>
    </div>
  );
}
