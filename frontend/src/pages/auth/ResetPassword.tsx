import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/AuthControls";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/schemas/authSchemas";
import { useResetPassword, apiErrorMessage } from "@/hooks/useAuth";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const resetPassword = useResetPassword();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setFormError("This reset link is missing its token. Please request a new one.");
      return;
    }
    setFormError(null);
    try {
      await resetPassword.mutateAsync({ token, newPassword: values.newPassword });
      navigate("/login", { state: { passwordReset: true } });
    } catch (error) {
      setFormError(apiErrorMessage(error, "This link may have expired. Please request a new one."));
    }
  };

  return (
    <AuthLayout
      eyebrow="Password reset"
      title="Choose a new password"
      footer={
        <Link to="/forgot-password" className="font-medium text-accent hover:text-accent-hover">
          Request a new link
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use at least 8 characters, with an uppercase letter and a number."
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <FormField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {formError && (
          <p role="alert" className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <SubmitButton loading={isSubmitting || resetPassword.isPending}>Reset password</SubmitButton>
      </form>
    </AuthLayout>
  );
}
