import { useState } from "react";
import { Link, useLocation } from "react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SubmitButton } from "@/components/auth/AuthControls";
import { useResendVerification, apiErrorMessage } from "@/hooks/useAuth";

export default function CheckYourEmailPage() {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email;
  const resend = useResendVerification();
  const [status, setStatus] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    setStatus(null);
    try {
      await resend.mutateAsync(email);
      setStatus("Verification email sent again — check your inbox.");
    } catch (error) {
      setStatus(apiErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      eyebrow="One more step"
      title="Check your email"
      subtitle={
        email
          ? `We sent a verification link to ${email}. Click it to activate your account.`
          : "We sent you a verification link. Click it to activate your account."
      }
      footer={
        <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
          Back to login
        </Link>
      }
    >
      <SubmitButton type="button" onClick={handleResend} loading={resend.isPending} disabled={!email}>
        Resend verification email
      </SubmitButton>
      {status && <p className="mt-4 text-center text-sm text-ink-900/60 dark:text-paper-50/60">{status}</p>}
    </AuthLayout>
  );
}
