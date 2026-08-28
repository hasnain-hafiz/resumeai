import { useNavigate, useParams } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { TemplateRenderer } from "@/components/templates/TemplateRenderer";
import { SAMPLE_RESUME } from "@/components/templates/sampleResume";
import { useResume, useSelectTemplate } from "@/hooks/useResumes";
import { useTemplates } from "@/hooks/useTemplates";
import { apiErrorMessage } from "@/hooks/useAuth";
import type { Template } from "@/types/template.types";

const THUMB_SCALE = 0.24;
// 210mm/297mm at the thumbnail scale, used to size each gallery card's clipping box.
const THUMB_WIDTH = `calc(210mm * ${THUMB_SCALE})`;
const THUMB_HEIGHT = `calc(297mm * ${THUMB_SCALE})`;

function TemplateCard({
  template, isSelected, onSelect, isSaving,
}: { template: Template; isSelected: boolean; onSelect: () => void; isSaving: boolean }) {
  return (
    <button
      onClick={onSelect}
      disabled={isSaving}
      className={`group text-left rounded-xl2 border bg-white p-3 shadow-card transition-all disabled:opacity-60 ${
        isSelected ? "border-accent ring-2 ring-accent/30" : "border-ink-900/8 hover:border-accent/40"
      }`}
    >
      <div
        className="relative mb-3 overflow-hidden rounded-lg border border-ink-900/8"
        style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }}
      >
        <TemplateRenderer resume={SAMPLE_RESUME} templateKey={template.key} scale={THUMB_SCALE} />
        {isSelected && (
          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] text-white">
            ✓
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-ink-950">{template.name}</p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="text-[11px] text-ink-900/45">{template.category.replace(/_/g, " ").toLowerCase()}</span>
        {template.atsFriendly && (
          <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">ATS-friendly</span>
        )}
      </div>
    </button>
  );
}

export default function TemplateGalleryPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { data: resume } = useResume(resumeId);
  const selectTemplate = useSelectTemplate(resumeId ?? "");

  const handleSelect = async (templateId: string) => {
    try {
      await selectTemplate.mutateAsync(templateId);
    } catch (error) {
      alert(apiErrorMessage(error, "Couldn't select that template."));
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => navigate(`/resumes/${resumeId}`)} className="mb-1 text-xs font-medium text-accent hover:text-accent-hover">
            ← Back to editor
          </button>
          <h1 className="font-display text-2xl text-ink-950 dark:text-paper-50">Choose a template</h1>
          <p className="text-sm text-ink-900/55 dark:text-paper-50/55">
            Previews use sample content so you can compare styles at a glance.
          </p>
        </div>
        {resumeId && (
          <button
            onClick={() => navigate(`/resumes/${resumeId}/preview`)}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Preview your resume →
          </button>
        )}
      </div>

      {templatesLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl2 bg-ink-900/5" />
          ))}
        </div>
      )}

      {templates && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={resume?.template?.id === template.id}
              onSelect={() => handleSelect(template.id)}
              isSaving={selectTemplate.isPending}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
