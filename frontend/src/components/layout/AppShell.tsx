import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";

export function AppShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper-100 dark:bg-ink-950">
      <header className="sticky top-0 z-10 border-b border-ink-900/8 dark:border-paper-50/10 bg-paper-50/90 dark:bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-ink-950 dark:text-paper-50">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-display text-base text-white">
              R
            </span>
            ResumeAI
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 text-sm text-ink-900 dark:text-paper-50 hover:bg-ink-900/[0.04] dark:hover:bg-paper-50/5"
            >
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-medium text-accent">
                  {user?.fullName?.charAt(0).toUpperCase() ?? "U"}
                </span>
              )}
              <span className="max-w-[10rem] truncate">{user?.fullName ?? "Account"}</span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900 py-1.5 shadow-card">
                  <Link
                    to="/settings"
                    className="block px-3.5 py-2 text-sm text-ink-900 dark:text-paper-50 hover:bg-ink-900/[0.04] dark:hover:bg-paper-50/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => logout.mutate()}
                    className="block w-full px-3.5 py-2 text-left text-sm text-danger hover:bg-danger/5"
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
