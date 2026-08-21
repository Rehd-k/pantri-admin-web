"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  clearSession,
  getToken,
  setToken as persistToken,
  SESSION_EXPIRED_EVENT,
  USER_KEY,
} from "./api";
import type { AuthResponse, AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  applySession: (response: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PORTAL_ROLES = new Set(["ADMIN", "NUTRITIONIST"]);

function canAccessPortal(user: AuthUser): boolean {
  return PORTAL_ROLES.has(user.role) && user.status === "ACTIVE";
}

function persistUser(user: AuthUser): void {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const token = getToken();
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const me = await api.get<AuthUser>("/auth/me");
        if (!canAccessPortal(me)) {
          clearSession();
          if (!cancelled) setUser(null);
          return;
        }
        persistUser(me);
        if (!cancelled) setUser(me);
      } catch {
        clearSession();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onExpired() {
      setUser(null);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const applySession = useCallback(
    (response: AuthResponse) => {
      if (!PORTAL_ROLES.has(response.user.role)) {
        throw new Error(
          "This portal is for Pantri admins and nutritionists only.",
        );
      }
      if (response.user.status !== "ACTIVE") {
        throw new Error("This account is not active.");
      }
      persistToken(response.accessToken);
      persistUser(response.user);
      setUser(response.user);
      router.replace(
        response.user.role === "NUTRITIONIST" ? "/meal-plans" : "/",
      );
    },
    [router],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      applySession(response);
    },
    [applySession],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, applySession, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
