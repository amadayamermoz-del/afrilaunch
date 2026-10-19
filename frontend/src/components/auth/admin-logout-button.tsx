"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuthSession } from "./auth-session-provider";

export function AdminLogoutButton() {
  const router = useRouter();
  const { logout } = useAuthSession();
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");
    try {
      await logout();
      router.replace("/login");
    } catch {
      setError("La déconnexion a échoué. Réessayez.");
    }
  }

  return (
    <span>
      <button className="admin-demo__back" type="button" onClick={handleLogout}>
        <ArrowLeft size={15} /> Déconnexion
      </button>
      {error && <small role="alert">{error}</small>}
    </span>
  );
}
