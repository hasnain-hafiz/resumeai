import { apiClient } from "@/lib/axiosClient";
import type { ApiMessageResponse, AuthResponse, User } from "@/types/auth.types";

export const authApi = {
  register: (payload: { fullName: string; email: string; password: string }) =>
    apiClient.post<ApiMessageResponse>("/auth/register", payload).then((r) => r.data),

  login: (payload: { email: string; password: string }) =>
    apiClient.post<AuthResponse>("/auth/login", payload).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post<ApiMessageResponse>("/auth/logout", { refreshToken }).then((r) => r.data),

  verifyEmail: (token: string) =>
    apiClient.post<ApiMessageResponse>("/auth/verify-email", { token }).then((r) => r.data),

  resendVerification: (email: string) =>
    apiClient.post<ApiMessageResponse>("/auth/resend-verification", { email }).then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post<ApiMessageResponse>("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    apiClient.post<ApiMessageResponse>("/auth/reset-password", payload).then((r) => r.data),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.post<ApiMessageResponse>("/auth/change-password", payload).then((r) => r.data),

  getCurrentUser: () => apiClient.get<User>("/auth/me").then((r) => r.data),

  updateProfile: (payload: { fullName?: string; photoUrl?: string }) =>
    apiClient.patch<User>("/auth/me", payload).then((r) => r.data),

  deleteAccount: () => apiClient.delete<ApiMessageResponse>("/auth/me").then((r) => r.data),
};
