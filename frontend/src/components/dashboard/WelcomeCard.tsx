import { Link } from "react-router";
import type { DashboardProfileCompletion, DashboardWelcome } from "@/types/dashboard.types";

function firstName(fullName: string): string {
  return fullName.trim().split(" ")[0] ?? fullName;
}

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function WelcomeCard({
  welcome,
  profileCompletion,
}: {
  welcome: DashboardWelcome;
  profileCompletion: DashboardProfileCompletion;
}) {
  return (
    <div className="rounded-xl2 border border-ink-900/8 dark:border-paper-50/10 bg-white dark:bg-ink-900 p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-900/40 dark:text-paper-50/40 mb-2">
            {timeOfDayGreeting()}
          </p>
          <h1 className="font-display text-3xl text-ink-950 dark:text-paper-50">
            Welcome back, {firstName(welcome.fullName)}
          </h1>
        </div>

        {welcome.photoUrl ? (
          <img
            src={welcome.photoUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-accent-soft"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-xl text-accent ring-4 ring-accent-soft/60">
            {welcome.fullName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {profileCompletion.percentage < 100 && (
        <div className="mt-6 rounded-xl bg-accent-soft/60 dark:bg-accent/10 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-ink-900 dark:text-paper-50">
              Your profile is {profileCompletion.percentage}% complete
            </span>
          </div>
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-900/10 dark:bg-paper-50/10">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${profileCompletion.percentage}%` }}
            />
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-900/70 dark:text-paper-50/70">
            {profileCompletion.missingSteps.map((step) => (
              <li key={step} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-accent" />
                {step}
              </li>
            ))}
          </ul>
          <Link to="/settings" className="mt-3 inline-block text-sm font-medium text-accent hover:text-accent-hover">
            Complete your profile →
          </Link>
        </div>
      )}
    </div>
  );
}
