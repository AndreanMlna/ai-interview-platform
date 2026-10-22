import api from "./api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  password_confirmation?: string;
  role?: "admin" | "user";
}

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user?: AuthUser;
  message?: string;
}

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", data),

  signup: (data: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", data),
};
