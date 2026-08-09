import type { ReactNode } from "react";
import { Link } from "react-router";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Two-panel shell used by every auth screen: a quiet editorial panel on the
 * left carrying the brand voice, and the working form on the right. Kept
 * deliberately calm - one accent color, one signature move (the panel split
 * itself + the serif headline), everything else disciplined and quiet.
 */
export function AuthLayout({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] bg-paper-50 dark:bg-ink-950">
      {/* Editorial panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 bg-ink-950 text-paper-50 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-accent/20 blur-[100px]"
        />
        <Link to="/" className="relative flex items-center gap-2 text-sm font-medium tracking-wide">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-display text-base">
            R
          </span>
          ResumeAI
        </Link>

        <div className="relative max-w-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-paper-50/50 mb-4">Built for the job hunt</p>
          <h2 className="font-display text-4xl leading-[1.15] mb-4">
            Every résumé is a first draft of an offer letter.
          </h2>
          <p className="text-paper-50/60 text-sm leading-relaxed">
            Structured data in, polished pages out — with AI that rewrites your experience instead of
            inventing it.
          </p>
        </div>

        <p className="relative text-xs text-paper-50/40">© {new Date().getFullYear()} ResumeAI, Inc.</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="lg:hidden mb-10 flex items-center gap-2 text-sm font-medium">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white font-display text-base">
              R
            </span>
            ResumeAI
          </Link>

          <p className="text-xs uppercase tracking-[0.2em] text-ink-900/40 dark:text-paper-50/40 mb-3">
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl text-ink-950 dark:text-paper-50 mb-2">{title}</h1>
          {subtitle && (
            <p className="text-sm text-ink-900/60 dark:text-paper-50/60 mb-8">{subtitle}</p>
          )}
          {!subtitle && <div className="mb-8" />}

          {children}

          {footer && <div className="mt-8 text-sm text-center text-ink-900/60 dark:text-paper-50/60">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
