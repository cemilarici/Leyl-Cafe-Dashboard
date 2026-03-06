import { api, setAccessToken } from "./api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "owner" | "manager";
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  setAccessToken(data.access_token);
  return data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

