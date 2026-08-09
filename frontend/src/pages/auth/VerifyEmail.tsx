import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useVerifyEmail, apiErrorMessage } from "@/hooks/useAuth";

type VerifyState = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const verifyEmail = useVerifyEmail();
  const [state, setState] = useState<VerifyState>("verifying");
  const [message, setMessage] = useState("Confirming your email address…");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!token) {
      setState("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    verifyEmail.mutate(token, {
      onSuccess: () => {
        setState("success");
        setMessage("Your email is verified. You can log in now.");
      },
      onError: (error) => {
        setState("error");
        setMessage(apiErrorMessage(error, "This link is invalid or has expired."));
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthLayout
      eyebrow="Email verification"
      title={state === "success" ? "You're verified" : state === "error" ? "Verification failed" : "Verifying…"}
      subtitle={message}
      footer={
        <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
          Back to login
        </Link>
      }
    >
      {state === "verifying" && (
        <div className="flex justify-center py-4">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        </div>
      )}
      {state === "error" && (
        <Link
          to="/login"
          className="block w-full rounded-xl bg-accent py-2.5 text-center text-sm font-medium text-white hover:bg-accent-hover"
        >
          Go to login
        </Link>
      )}
    </AuthLayout>
  );
}
