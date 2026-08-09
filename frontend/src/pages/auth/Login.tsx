import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton, GoogleButton, Divider } from "@/components/auth/AuthControls";
import { loginSchema, type LoginFormValues } from "@/schemas/authSchemas";
import { useLogin, apiErrorMessage } from "@/hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await login.mutateAsync(values);
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(apiErrorMessage(error, "We couldn't log you in. Check your details and try again."));
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

        <SubmitButton loading={isSubmitting || login.isPending}>Log in</SubmitButton>
      </form>
    </AuthLayout>
  );
}
