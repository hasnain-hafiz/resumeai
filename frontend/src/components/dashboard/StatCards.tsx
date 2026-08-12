import type { ReactNode } from "react";
import { Link } from "react-router";
import type { DashboardAiUsage } from "@/types/dashboard.types";

export function StatCard({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: number;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link
      to={href}
      className="group rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card transition-transform hover:-translate-y-0.5"
    >
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent dark:bg-accent/15">
        {icon}
      </div>
      <p className="font-display text-3xl text-ink-950 dark:text-paper-50">{value}</p>
      <p className="mt-1 text-sm text-ink-900/60 dark:text-paper-50/60 group-hover:text-accent">{label}</p>
    </Link>
  );
}

export function AiUsageCard({ aiUsage }: { aiUsage: DashboardAiUsage }) {
  const usedPct = aiUsage.monthlyLimit > 0 ? Math.min(100, (aiUsage.used / aiUsage.monthlyLimit) * 100) : 0;
  const resetDate = new Date(aiUsage.resetsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-5 shadow-card">
      <p className="mb-1 text-sm text-ink-900/60 dark:text-paper-50/60">AI generations this month</p>
      <p className="font-display text-3xl text-ink-950 dark:text-paper-50">
        {aiUsage.used}
        <span className="text-base font-sans text-ink-900/40 dark:text-paper-50/40"> / {aiUsage.monthlyLimit}</span>
      </p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-900/10 dark:bg-paper-50/10">
        <div
          className={`h-full rounded-full transition-all ${usedPct >= 90 ? "bg-danger" : "bg-accent"}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-900/45 dark:text-paper-50/45">Resets {resetDate}</p>
    </div>
  );
}
