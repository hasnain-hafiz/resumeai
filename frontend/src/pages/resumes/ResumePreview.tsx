import { useNavigate, useParams } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { TemplateRenderer } from "@/components/templates/TemplateRenderer";
import { useResume } from "@/hooks/useResumes";
import { apiErrorMessage } from "@/hooks/useAuth";

export default function ResumePreviewPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const { data: resume, isLoading, isError, error } = useResume(resumeId);

  if (isLoading) {
    return (
      <AppShell>
        <div className="h-[400px] animate-pulse rounded-xl2 bg-ink-900/5" />
      </AppShell>
    );
  }

  if (isError || !resume) {
    return (
      <AppShell>
        <p className="rounded-xl2 border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          {apiErrorMessage(error, "Couldn't load this resume.")}
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={() => navigate(`/resumes/${resumeId}`)} className="mb-1 text-xs font-medium text-accent hover:text-accent-hover">
            ← Back to editor
          </button>
          <h1 className="font-display text-2xl text-ink-950 dark:text-paper-50">{resume.title}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/resumes/${resumeId}/templates`)}
            className="rounded-xl border border-ink-900/10 dark:border-paper-50/15 px-4 py-2 text-sm font-medium text-ink-900 dark:text-paper-50 hover:bg-ink-900/[0.03] dark:hover:bg-paper-50/5"
          >
            Change template
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      {!resume.template && (
        <p className="no-print mb-4 rounded-lg bg-accent-soft dark:bg-accent/10 px-3 py-2 text-xs text-ink-900 dark:text-paper-50">
          No template selected yet — showing the default (Modern) style.{" "}
          <button onClick={() => navigate(`/resumes/${resumeId}/templates`)} className="font-medium text-accent hover:text-accent-hover">
            Choose one →
          </button>
        </p>
      )}

      <div className="resume-print-root flex justify-center overflow-x-auto pb-10">
        <TemplateRenderer resume={resume} templateKey={resume.template?.key} />
      </div>
    </AppShell>
  );
}
