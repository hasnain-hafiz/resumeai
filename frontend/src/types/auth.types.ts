export type AuthProvider = "LOCAL" | "GOOGLE";
export type UserRole = "USER" | "ADMIN";

export interface User {
  id: string;
  fullName: string;
  email: string;
  photoUrl: string | null;
  role: UserRole;
  provider: AuthProvider;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: User;
}

export interface ApiMessageResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  /** Stable identifier (e.g. "EMAIL_NOT_VERIFIED") for branching logic - prefer this over parsing `message`. */
  code: string | null;
  path: string;
  fieldErrors: ApiFieldError[] | null;
}
