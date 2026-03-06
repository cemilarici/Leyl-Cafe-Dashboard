"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, login as apiLogin, logout as apiLogout } from "@/lib/auth";
import { api, setAccessToken } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        // Try to get a new access token using the httpOnly refresh cookie
        const { data: tokenData } = await api.post<{ access_token: string; user?: User }>(
          "/auth/refresh",
          {},
          { withCredentials: true }
        );
        setAccessToken(tokenData.access_token);
        if (tokenData.user) {
          setUser(tokenData.user);
        } else {
          const { data: me } = await api.get<User>("/auth/me");
          setUser(me);
        }
      } catch {
        // No valid session — user will be redirected to login by layout
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    restore();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setUser(res.user);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
