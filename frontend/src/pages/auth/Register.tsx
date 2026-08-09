import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton, GoogleButton, Divider } from "@/components/auth/AuthControls";
import { registerSchema, type RegisterFormValues } from "@/schemas/authSchemas";
import { useRegister, apiErrorMessage } from "@/hooks/useAuth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useRegister();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      await registerUser.mutateAsync(values);
      navigate("/check-your-email", { state: { email: values.email } });
    } catch (error) {
      setFormError(apiErrorMessage(error, "We couldn't create your account. Please try again."));
    }
  };

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      subtitle="Free forever. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
            Log in
          </Link>
        </>
      }
    >
      <GoogleButton label="Sign up with Google" />
      <Divider />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          label="Full name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use at least 8 characters, with an uppercase letter and a number."
          error={errors.password?.message}
          {...register("password")}
        />
        <FormField
          label="Confirm password"
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

        <p className="mb-5 text-xs text-ink-900/50 dark:text-paper-50/50">
          By signing up, you agree to ResumeAI's Terms of Service and Privacy Policy.
        </p>

        <SubmitButton loading={isSubmitting || registerUser.isPending}>Create account</SubmitButton>
      </form>
    </AuthLayout>
  );
}
