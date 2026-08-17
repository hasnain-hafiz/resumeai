import { Link } from "react-router";
import { AppShell } from "@/components/layout/AppShell";

export function ComingSoonPage({ title, feature }: { title: string; feature: string }) {
  return (
    <AppShell>
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-ink-900/40 dark:text-paper-50/40">
          Coming soon
        </p>
        <h1 className="mb-3 font-display text-2xl text-ink-950 dark:text-paper-50">{title}</h1>
        <p className="mb-6 text-sm text-ink-900/60 dark:text-paper-50/60">
          {feature} hasn't been built yet — it's next up on the roadmap.
        </p>
        <Link to="/dashboard" className="text-sm font-medium text-accent hover:text-accent-hover">
          ← Back to dashboard
        </Link>
      </div>
    </AppShell>
  );
}
