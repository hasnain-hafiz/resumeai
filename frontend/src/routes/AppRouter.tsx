import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { GuestOnlyRoute, ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";
import LoginPage from "@/pages/auth/Login";
import RegisterPage from "@/pages/auth/Register";
import CheckYourEmailPage from "@/pages/auth/CheckYourEmail";
import VerifyEmailPage from "@/pages/auth/VerifyEmail";
import ForgotPasswordPage from "@/pages/auth/ForgotPassword";
import ResetPasswordPage from "@/pages/auth/ResetPassword";
import OAuthCallbackPage from "@/pages/auth/OAuthCallback";
import DashboardPage from "@/pages/Dashboard";
import { ComingSoonPage } from "@/pages/ComingSoon";

// Routes the Dashboard links to that belong to features later in the build
// order. Each becomes a real page when its own feature ships - listing them
// here just keeps today's dashboard links from dead-ending.
const UPCOMING_ROUTES: { path: string; title: string; feature: string }[] = [
  { path: "/resumes", title: "Your resumes", feature: "Resume Builder" },
  { path: "/resumes/new", title: "New resume", feature: "Resume Builder" },
  { path: "/cover-letters", title: "Your cover letters", feature: "AI Cover Letter Generator" },
  { path: "/cover-letters/new", title: "New cover letter", feature: "AI Cover Letter Generator" },
  { path: "/ats", title: "ATS analyses", feature: "AI ATS Optimizer" },
  { path: "/ats/new", title: "New ATS check", feature: "AI ATS Optimizer" },
  { path: "/interview-coach", title: "Interview coach", feature: "AI Interview Coach" },
  { path: "/settings", title: "Settings", feature: "User Settings" },
];

function NotFound() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<GuestOnlyRoute><LoginPage /></GuestOnlyRoute>} />
        <Route path="/register" element={<GuestOnlyRoute><RegisterPage /></GuestOnlyRoute>} />
        <Route path="/check-your-email" element={<CheckYourEmailPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<GuestOnlyRoute><ForgotPasswordPage /></GuestOnlyRoute>} />
        <Route path="/reset-password" element={<GuestOnlyRoute><ResetPasswordPage /></GuestOnlyRoute>} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {UPCOMING_ROUTES.map(({ path, title, feature }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute>
                <ComingSoonPage title={title} feature={feature} />
              </ProtectedRoute>
            }
          />
        ))}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
