import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/AuthControls";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/schemas/authSchemas";
import { useResendVerification, apiErrorMessage } from "@/hooks/useAuth";

/**
 * Reachable three ways, in priority order: navigation state from Register
 * (the common case), a `?email=` query param (for links we control, e.g. a
 * future "resend" link in a login error), or - if neither is present, such
 * as a bookmarked/reopened tab - a plain email field so the flow never
 * dead-ends just because the browser tab with the original context is gone.
 */
export default function CheckYourEmailPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const stateEmail = (location.state as { email?: string })?.email;
  const knownEmail = stateEmail ?? searchParams.get("email") ?? undefined;

  const resend = useResendVerification();
  const [status, setStatus] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: knownEmail ?? "" },
  });

  const sendTo = async (email: string) => {
    setStatus(null);
    try {
      await resend.mutateAsync(email);
      setSentTo(email);
      setStatus("Verification email sent — check your inbox.");
    } catch (error) {
      setStatus(apiErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      eyebrow="One more step"
      title="Check your email"
      subtitle={
        knownEmail
          ? `We sent a verification link to ${knownEmail}. Click it to activate your account.`
          : "Enter your email and we'll send you a new verification link."
      }
      footer={
        <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
          Back to login
        </Link>
      }
    >
      {knownEmail ? (
        <SubmitButton type="button" onClick={() => sendTo(knownEmail)} loading={resend.isPending}>
          Resend verification email
        </SubmitButton>
      ) : (
        <form onSubmit={handleSubmit((values) => sendTo(values.email))} noValidate>
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <SubmitButton loading={resend.isPending}>Send verification email</SubmitButton>
        </form>
      )}

      {status && (
        <p className="mt-4 text-center text-sm text-ink-900/60 dark:text-paper-50/60">{status}</p>
      )}

      {/* Once we know a working address (from a submit or the initial state), offer a quick resend without retyping it. */}
      {!knownEmail && sentTo && (
        <button
          onClick={() => sendTo(sentTo)}
          disabled={resend.isPending}
          className="mt-2 block w-full text-center text-xs font-medium text-accent hover:text-accent-hover disabled:opacity-60"
        >
          Send it again
        </button>
      )}
    </AuthLayout>
  );
}
