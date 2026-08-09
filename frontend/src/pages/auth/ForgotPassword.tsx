import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/AuthControls";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/schemas/authSchemas";
import { useForgotPassword, apiErrorMessage } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setFormError(null);
    try {
      await forgotPassword.mutateAsync(values.email);
      setSubmitted(true);
    } catch (error) {
      // The API never reveals whether an email exists, so genuine errors here
      // are rare (validation aside) - but network/5xx failures still surface.
      setFormError(apiErrorMessage(error));
    }
  };

  if (submitted) {
    return (
      <AuthLayout
        eyebrow="Password reset"
        title="Check your inbox"
        subtitle="If an account exists for that email, we've sent a link to reset your password."
        footer={
          <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
            Back to login
          </Link>
        }
      >
        <></>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Password reset"
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        {formError && (
          <p role="alert" className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <SubmitButton loading={isSubmitting || forgotPassword.isPending}>Send reset link</SubmitButton>
      </form>
    </AuthLayout>
  );
}
