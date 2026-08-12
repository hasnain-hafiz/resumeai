import type { ActivityType, DashboardActivityItem } from "@/types/dashboard.types";

const LABELS: Record<ActivityType, string> = {
  ACCOUNT_CREATED: "Account",
  PROFILE_UPDATED: "Profile",
  RESUME_CREATED: "Resume",
  COVER_LETTER_CREATED: "Cover letter",
  ATS_ANALYSIS_RUN: "ATS analysis",
  AI_FEATURE_USED: "AI",
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RecentActivity({ items }: { items: DashboardActivityItem[] }) {
  return (
    <div className="rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card">
      <h2 className="mb-4 font-display text-lg text-ink-950 dark:text-paper-50">Recent activity</h2>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-900/50 dark:text-paper-50/50">
          Nothing here yet — your activity will show up as you use ResumeAI.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 hover:bg-ink-900/[0.03] dark:hover:bg-paper-50/5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent dark:bg-accent/15">
                  {LABELS[item.type]}
                </span>
                <span className="truncate text-sm text-ink-900 dark:text-paper-50">{item.title}</span>
              </div>
              <span className="shrink-0 text-xs text-ink-900/40 dark:text-paper-50/40">
                {relativeTime(item.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
