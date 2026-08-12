import { Link } from "react-router";

interface QuickAction {
  label: string;
  description: string;
  href: string;
}

// Static for now - these are navigation shortcuts, not user data, so there's
// no backend endpoint behind them. Each target route lands as its own
// feature (Resume Builder, AI Cover Letter Generator, ATS Optimizer).
const QUICK_ACTIONS: QuickAction[] = [
  { label: "New resume", description: "Start from a template or blank page", href: "/resumes/new" },
  { label: "Write a cover letter", description: "Let AI draft one from your resume", href: "/cover-letters/new" },
  { label: "Run an ATS check", description: "See how you score against a job post", href: "/ats/new" },
  { label: "Practice interview questions", description: "AI-generated questions for your role", href: "/interview-coach" },
];

export function QuickActions() {
  return (
    <div className="rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card">
      <h2 className="mb-4 font-display text-lg text-ink-950 dark:text-paper-50">Quick actions</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            to={action.href}
            className="rounded-xl border border-ink-900/8 dark:border-paper-50/10 p-3.5 transition-colors hover:border-accent/40 hover:bg-accent-soft/40 dark:hover:bg-accent/10"
          >
            <p className="text-sm font-medium text-ink-900 dark:text-paper-50">{action.label}</p>
            <p className="mt-0.5 text-xs text-ink-900/55 dark:text-paper-50/55">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
