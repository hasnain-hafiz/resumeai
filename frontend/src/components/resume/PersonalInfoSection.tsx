import { useEffect, useState } from "react";
import { RichTextEditor } from "@/components/resume/RichTextEditor";
import type { Resume } from "@/types/resume.types";

type DetailsForm = {
  title: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
  photoUrl: string;
  summary: string;
};
export type { DetailsForm };

function toForm(resume: Resume): DetailsForm {
  return {
    title: resume.title,
    fullName: resume.fullName ?? "",
    email: resume.email ?? "",
    phone: resume.phone ?? "",
    address: resume.address ?? "",
    linkedinUrl: resume.linkedinUrl ?? "",
    githubUrl: resume.githubUrl ?? "",
    portfolioUrl: resume.portfolioUrl ?? "",
    websiteUrl: resume.websiteUrl ?? "",
    photoUrl: resume.photoUrl ?? "",
    summary: resume.summary ?? "",
  };
}

function TextField({
  label, value, onChange, type = "text", placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-900/70 dark:text-paper-50/70">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
    </div>
  );
}

export function PersonalInfoSection({
  resume, onSave, isSaving, onDraftChange,
}: { resume: Resume; onSave: (form: DetailsForm) => void; isSaving: boolean; onDraftChange?: (form: DetailsForm) => void }) {
  const [form, setForm] = useState<DetailsForm>(() => toForm(resume));

  // Re-sync if a different resume loads (e.g. navigating between resumes).
  useEffect(() => setForm(toForm(resume)), [resume.id]);

  // Report every keystroke upward (not just on save) so the live preview
  // panel can reflect what's being typed before it's committed to the server -
  // this is the "instant while editing" half of the Live Preview feature.
  useEffect(() => onDraftChange?.(form), [form, onDraftChange]);

  const set = (key: keyof DetailsForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card">
        <h3 className="mb-4 font-display text-lg text-ink-950 dark:text-paper-50">Resume title</h3>
        <TextField label="Title (for your eyes only - not shown on the resume)" value={form.title} onChange={set("title")} />
      </div>

      <div className="rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card">
        <h3 className="mb-4 font-display text-lg text-ink-950 dark:text-paper-50">Personal information</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Full name" value={form.fullName} onChange={set("fullName")} />
          <TextField label="Email" type="email" value={form.email} onChange={set("email")} />
          <TextField label="Phone" value={form.phone} onChange={set("phone")} />
          <TextField label="Address" value={form.address} onChange={set("address")} />
          <TextField label="LinkedIn" value={form.linkedinUrl} onChange={set("linkedinUrl")} placeholder="linkedin.com/in/..." />
          <TextField label="GitHub" value={form.githubUrl} onChange={set("githubUrl")} placeholder="github.com/..." />
          <TextField label="Portfolio" value={form.portfolioUrl} onChange={set("portfolioUrl")} />
          <TextField label="Website" value={form.websiteUrl} onChange={set("websiteUrl")} />
          <TextField label="Photo URL" value={form.photoUrl} onChange={set("photoUrl")} placeholder="https://..." />
        </div>
      </div>

      <div className="rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card">
        <h3 className="mb-1 font-display text-lg text-ink-950 dark:text-paper-50">Professional summary</h3>
        <p className="mb-3 text-xs text-ink-900/50 dark:text-paper-50/50">
          A short pitch at the top of your resume - 2 to 4 sentences works best.
        </p>
        <RichTextEditor value={form.summary} onChange={set("summary")} placeholder="Write a brief summary of your experience..." />
      </div>

      <div className="flex items-center justify-end gap-3">
        {JSON.stringify(form) !== JSON.stringify(toForm(resume)) && (
          <p className="text-xs text-ink-900/45 dark:text-paper-50/45">Unsaved changes are already shown in the preview →</p>
        )}
        <button
          onClick={() => onSave(form)}
          disabled={isSaving}
          className="rounded-xl bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
