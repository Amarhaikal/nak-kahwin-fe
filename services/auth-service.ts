import { apiRequest } from "./api-client";

export interface AuthResponse {
  accessToken: string;
  userId: string;
  name: string;
  email: string;
  role: "groom" | "bride";
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "groom" | "bride";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
