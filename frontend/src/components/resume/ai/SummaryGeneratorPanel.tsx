import { useState } from "react";
import { apiErrorCode, apiErrorMessage } from "@/hooks/useAuth";
import { useGenerateAiSummary } from "@/hooks/useAiSummary";
import { CAREER_LEVEL_LABELS, type CareerLevel } from "@/types/ai.types";

const CAREER_LEVELS = Object.keys(CAREER_LEVEL_LABELS) as CareerLevel[];
const MAX_CONTEXT_LENGTH = 1000;

export function SummaryGeneratorPanel({
  resumeId, onApply,
}: { resumeId: string; onApply: (summary: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [careerLevel, setCareerLevel] = useState<CareerLevel>("MID_LEVEL");
  const [targetRole, setTargetRole] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);

  const generateSummary = useGenerateAiSummary(resumeId);

  const handleGenerate = () => {
    setGenerated(null);
    generateSummary.mutate(
      {
        careerLevel,
        targetRole: targetRole.trim() || undefined,
        additionalContext: additionalContext.trim() || undefined,
      },
      { onSuccess: (data) => setGenerated(data.summary) }
    );
  };

  const errorCode = apiErrorCode(generateSummary.error);
  const errorMessage = errorCode === "AI_QUOTA_EXCEEDED"
    ? apiErrorMessage(generateSummary.error)
    : generateSummary.isError
      ? apiErrorMessage(generateSummary.error, "Couldn't generate a summary. Please try again.")
      : null;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10"
      >
        <span aria-hidden>✨</span> Generate with AI
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-ink-950 dark:text-paper-50">Generate a summary with AI</h4>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setGenerated(null);
          }}
          className="text-xs text-ink-900/50 hover:text-ink-900/80 dark:text-paper-50/50 dark:hover:text-paper-50/80"
        >
          Close
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-900/70 dark:text-paper-50/70">Career level</label>
          <select
            value={careerLevel}
            onChange={(e) => setCareerLevel(e.target.value as CareerLevel)}
            className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          >
            {CAREER_LEVELS.map((level) => (
              <option key={level} value={level}>{CAREER_LEVEL_LABELS[level]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-900/70 dark:text-paper-50/70">
            Target role <span className="text-ink-900/40 dark:text-paper-50/40">(optional)</span>
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Backend Engineer - defaults to your most recent title"
            className="w-full rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-900/70 dark:text-paper-50/70">
            Anything else to mention? <span className="text-ink-900/40 dark:text-paper-50/40">(optional)</span>
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value.slice(0, MAX_CONTEXT_LENGTH))}
            rows={2}
            placeholder="e.g. open to remote roles, career switcher from finance..."
            className="w-full resize-none rounded-lg border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 px-3 py-2 text-sm text-ink-950 dark:text-paper-50 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
          <p className="mt-1 text-right text-[11px] text-ink-900/40 dark:text-paper-50/40">
            {additionalContext.length}/{MAX_CONTEXT_LENGTH}
          </p>
        </div>

        {errorMessage && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
        )}

        {generated && (
          <div className="rounded-lg border border-accent/20 bg-white dark:bg-ink-900 p-3">
            <p className="text-sm text-ink-950 dark:text-paper-50">{generated}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generateSummary.isPending}
            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {generateSummary.isPending ? "Generating..." : generated ? "Regenerate" : "Generate"}
          </button>

          {generated && (
            <button
              type="button"
              onClick={() => {
                onApply(generated);
                setIsOpen(false);
                setGenerated(null);
              }}
              className="rounded-lg border border-accent/30 px-4 py-1.5 text-xs font-medium text-accent hover:bg-accent/10"
            >
              Use this summary
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
