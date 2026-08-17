import { AppShell } from "@/components/layout/AppShell";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { StatCard, AiUsageCard } from "@/components/dashboard/StatCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useDashboard } from "@/hooks/useDashboard";
import { apiErrorMessage } from "@/hooks/useAuth";

function DocumentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 rounded-xl2 bg-ink-900/5 dark:bg-paper-50/5" />
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl2 bg-ink-900/5 dark:bg-paper-50/5" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl2 bg-ink-900/5 dark:bg-paper-50/5" />
        <div className="h-64 rounded-xl2 bg-ink-900/5 dark:bg-paper-50/5" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  return (
    <AppShell>
      {isLoading && <DashboardSkeleton />}

      {isError && (
        <div className="rounded-xl2 border border-danger/20 bg-danger/5 p-6 text-center">
          <p className="mb-3 text-sm text-danger">{apiErrorMessage(error, "Couldn't load your dashboard.")}</p>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-danger/10 px-4 py-1.5 text-sm font-medium text-danger hover:bg-danger/15"
          >
            Try again
          </button>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <WelcomeCard welcome={data.welcome} profileCompletion={data.profileCompletion} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Resumes" value={data.resumeCount} href="/resumes" icon={<DocumentIcon />} />
            <StatCard label="Cover letters" value={data.coverLetterCount} href="/cover-letters" icon={<MailIcon />} />
            <StatCard label="ATS analyses" value={data.atsAnalysisCount} href="/ats" icon={<TargetIcon />} />
            <AiUsageCard aiUsage={data.aiUsage} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <QuickActions />
            <RecentActivity items={data.recentActivity} />
          </div>
        </div>
      )}
    </AppShell>
  );
}
