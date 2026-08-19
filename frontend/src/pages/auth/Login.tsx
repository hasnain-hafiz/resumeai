import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton, GoogleButton, Divider } from "@/components/auth/AuthControls";
import { loginSchema, type LoginFormValues } from "@/schemas/authSchemas";
import { useLogin, useResendVerification, apiErrorMessage, apiErrorCode } from "@/hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const resend = useResendVerification();
  const [formError, setFormError] = useState<string | null>(null);
  // Set only when login fails specifically because the account isn't verified yet -
  // holds the email so the resend button doesn't need it retyped.
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    setUnverifiedEmail(null);
    setResendStatus(null);
    try {
      await login.mutateAsync(values);
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (apiErrorCode(error) === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(values.email);
      } else {
        setFormError(apiErrorMessage(error, "We couldn't log you in. Check your details and try again."));
      }
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResendStatus(null);
    try {
      await resend.mutateAsync(unverifiedEmail);
      setResendStatus("Sent — check your inbox for a new verification link.");
    } catch (error) {
      setResendStatus(apiErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to ResumeAI"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-accent hover:text-accent-hover">
            Sign up for free
          </Link>
          <br />
          <Link to="/check-your-email" className="mt-2 inline-block text-xs font-medium text-accent hover:text-accent-hover">
            Didn't get a verification email?
          </Link>
        </>
      }
    >
      <GoogleButton />
      <Divider />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <div>
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="-mt-3 mb-5 text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-accent hover:text-accent-hover">
              Forgot password?
            </Link>
          </div>
        </div>

        {formError && (
          <p role="alert" className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        {unverifiedEmail && (
          <div role="alert" className="mb-4 rounded-lg bg-accent-soft dark:bg-accent/10 px-3 py-2.5 text-sm">
            <p className="mb-2 text-ink-900 dark:text-paper-50">
              Please verify your email before logging in. If your original link expired, we can send a new one.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resend.isPending}
              className="text-xs font-medium text-accent hover:text-accent-hover disabled:opacity-60"
            >
              {resend.isPending ? "Sending..." : "Resend verification email"}
            </button>
            {resendStatus && <p className="mt-1.5 text-xs text-ink-900/60 dark:text-paper-50/60">{resendStatus}</p>}
          </div>
        )}

        <SubmitButton loading={isSubmitting || login.isPending}>Log in</SubmitButton>
      </form>
    </AuthLayout>
  );
}
