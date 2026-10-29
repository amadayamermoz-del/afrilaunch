"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/lib/auth-types";

const AuthSessionContext = createContext<{
  user: AuthUser | null;
  updateEmail: (email: string) => void;
  logout: () => Promise<void>;
} | null>(null);

export function AuthSessionProvider({
  user: initialUser,
  children,
}: Readonly<{ user: AuthUser; children: ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  const updateEmail = useCallback((email: string) => {
    setUser((currentUser) =>
      currentUser ? { ...currentUser, email } : currentUser,
    );
  }, []);

  const logout = useCallback(async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      throw new Error("La déconnexion a échoué.");
    }
    setUser(null);
  }, []);

  return (
    <AuthSessionContext.Provider value={{ user, updateEmail, logout }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const session = useContext(AuthSessionContext);
  if (!session) {
    throw new Error("useAuthSession must be used inside an authenticated route");
  }
  return session;
}
