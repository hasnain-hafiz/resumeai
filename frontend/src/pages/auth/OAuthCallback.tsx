import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { apiClient } from "@/lib/axiosClient";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/auth.types";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Tokens arrive in the URL fragment (never the query string, so they
    // never reach server logs) - see OAuth2LoginSuccessHandler on the backend.
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = fragment.get("accessToken");
    const refreshToken = fragment.get("refreshToken");

    if (!accessToken || !refreshToken) {
      navigate("/login?error=oauth", { replace: true });
      return;
    }

    // Temporarily set the access token so the /auth/me call below is authenticated.
    useAuthStore.setState({ accessToken, refreshToken });

    apiClient
      .get<User>("/auth/me")
      .then(({ data: user }) => {
        setSession({ accessToken, refreshToken, user });
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        useAuthStore.getState().clearSession();
        navigate("/login?error=oauth", { replace: true });
      });
  }, [navigate, setSession]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-50 dark:bg-ink-950">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
    </div>
  );
}
