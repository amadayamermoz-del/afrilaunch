import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/lib/auth-proxy";
import { isAuthUser, type AuthUser } from "@/lib/auth-types";
import { AuthSessionProvider } from "./auth-session-provider";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://127.0.0.1:4000/api";

export async function ProtectedRoute({
  role,
  children,
}: Readonly<{
  role: AuthUser["role"];
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    redirect("/login");
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    throw new Error("Impossible de joindre le serveur d'authentification.");
  }

  if (response.status === 401) {
    redirect("/login");
  }
  if (!response.ok) {
    throw new Error("La vérification de votre session a échoué.");
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("Le serveur d'authentification a renvoyé une réponse invalide.");
  }
  if (!isAuthUser(result)) {
    throw new Error("Le serveur d'authentification a renvoyé un profil invalide.");
  }
  if (result.role !== role) {
    redirect(result.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <AuthSessionProvider user={result}>
      {children}
    </AuthSessionProvider>
  );
}
