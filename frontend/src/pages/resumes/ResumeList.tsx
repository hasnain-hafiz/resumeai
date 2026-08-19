import { useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useCreateResume, useDeleteResume, useResumeList } from "@/hooks/useResumes";
import { apiErrorMessage } from "@/hooks/useAuth";

export default function ResumeListPage() {
  const { data: resumes, isLoading, isError, error } = useResumeList();
  const createResume = useCreateResume();
  const deleteResume = useDeleteResume();
  const navigate = useNavigate();
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    const created = await createResume.mutateAsync("Untitled Resume");
    navigate(`/resumes/${created.id}`);
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink-950 dark:text-paper-50">Your resumes</h1>
        <button
          onClick={handleCreate}
          disabled={createResume.isPending}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {createResume.isPending ? "Creating..." : "+ New resume"}
        </button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl2 bg-ink-900/5 dark:bg-paper-50/5" />
          ))}
        </div>
      )}

      {isError && (
        <p className="rounded-xl2 border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          {apiErrorMessage(error, "Couldn't load your resumes.")}
        </p>
      )}

      {resumes && resumes.length === 0 && (
        <div className="rounded-xl2 border border-dashed border-ink-900/15 dark:border-paper-50/15 p-12 text-center">
          <p className="mb-1 font-display text-lg text-ink-950 dark:text-paper-50">No resumes yet</p>
          <p className="text-sm text-ink-900/55 dark:text-paper-50/55">Create your first one to get started.</p>
        </div>
      )}

      {resumes && resumes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="group relative rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card transition-transform hover:-translate-y-0.5"
            >
              <button onClick={() => navigate(`/resumes/${resume.id}`)} className="block w-full text-left">
                <p className="mb-1 truncate font-display text-lg text-ink-950 dark:text-paper-50">{resume.title}</p>
                <p className="text-xs text-ink-900/45 dark:text-paper-50/45">
                  Updated {new Date(resume.updatedAt).toLocaleDateString()}
                </p>
              </button>

              {confirmingDeleteId === resume.id ? (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-ink-900/60 dark:text-paper-50/60">Delete this resume?</span>
                  <button
                    onClick={() => { deleteResume.mutate(resume.id); setConfirmingDeleteId(null); }}
                    className="font-medium text-danger hover:text-danger/80"
                  >
                    Yes, delete
                  </button>
                  <button onClick={() => setConfirmingDeleteId(null)} className="font-medium text-ink-900/60 dark:text-paper-50/60">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingDeleteId(resume.id)}
                  className="mt-3 text-xs font-medium text-ink-900/40 opacity-0 hover:text-danger group-hover:opacity-100 dark:text-paper-50/40"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
