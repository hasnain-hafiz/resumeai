import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { authApi } from "@/api/authApi";
import { useAuthStore } from "@/store/authStore";
import type { ApiErrorResponse } from "@/types/auth.types";

export function apiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.message ?? fallback;
}

/** Reads the stable error code (e.g. "EMAIL_NOT_VERIFIED") so UI can branch on it instead of matching message text. */
export function apiErrorCode(error: unknown): string | null {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.code ?? null;
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
    },
  });
}

export function useRegister() {
  return useMutation({ mutationFn: authApi.register });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: (token: string) => authApi.verifyEmail(token) });
}

export function useResendVerification() {
  return useMutation({ mutationFn: (email: string) => authApi.resendVerification(email) });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => authApi.forgotPassword(email) });
}

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword });
}

export function useChangePassword() {
  return useMutation({ mutationFn: authApi.changePassword });
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getCurrentUser,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  return useMutation({
    mutationFn: () => authApi.logout(refreshToken ?? ""),
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
