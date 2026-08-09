import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { GuestOnlyRoute, ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LoginPage from "@/pages/auth/Login";
import RegisterPage from "@/pages/auth/Register";
import CheckYourEmailPage from "@/pages/auth/CheckYourEmail";
import VerifyEmailPage from "@/pages/auth/VerifyEmail";
import ForgotPasswordPage from "@/pages/auth/ForgotPassword";
import ResetPasswordPage from "@/pages/auth/ResetPassword";
import OAuthCallbackPage from "@/pages/auth/OAuthCallback";

// Placeholder until Feature 2 (Dashboard) is built - keeps ProtectedRoute
// meaningfully testable end-to-end for this feature's review.
function DashboardPlaceholder() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-50 dark:bg-ink-950">
      <p className="text-ink-900 dark:text-paper-50">You're logged in. Dashboard lands in Feature 2.</p>
    </div>
  );
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
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
