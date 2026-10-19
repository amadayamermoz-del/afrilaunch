"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Bell, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { apiError, isAccountProfile, type AccountProfile } from "@/types/account-data";

export default function SettingsPage() {
  const { user } = useAuthSession();
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(apiError(body, "Impossible de charger les informations du compte."));
        if (!isAccountProfile(body)) throw new Error("La réponse du serveur pour le compte est invalide.");
        return body;
      })
      .then((result) => { if (active) setAccount(result); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : "Impossible de charger les informations du compte."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (newPassword !== confirmPassword) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body, "Impossible de modifier le mot de passe."));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Votre mot de passe a été modifié.");
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Impossible de modifier le mot de passe.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DashboardPageHeader eyebrow="Votre compte" title="Paramètres" description="Consultez les informations de votre compte et gérez son accès." />
      {error && <p className="dashboard-form-error" role="alert">{error}</p>}
      {notice && <p className="dashboard-notice" role="status">{notice}</p>}
      <div className="dashboard-stack">
        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Informations du compte</h2><p>Données de votre compte AfriLaunch.</p></div><UserRound size={18} color="#6d28d9" /></header>
          <div className="dashboard-card__body">
            {loading ? <p role="status">Chargement des informations…</p> : <>
              <div className="dashboard-row"><div className="dashboard-row__copy"><strong>Nom</strong><span>{account?.name ?? user?.name ?? "—"}</span></div></div>
              <div className="dashboard-row"><div className="dashboard-row__copy"><strong>Adresse e-mail</strong><span>{account?.email ?? user?.email ?? "—"}</span></div></div>
              <div className="dashboard-row"><div className="dashboard-row__copy"><strong>Type de compte</strong><span>{user?.role === "ADMIN" ? "Administrateur" : "Utilisateur"}</span></div><ShieldCheck size={15} color="#94a3b8" /></div>
              <div className="dashboard-row"><div className="dashboard-row__copy"><strong>Statut</strong><span>{user?.status === "ACTIVE" ? "Actif" : "Suspendu"}</span></div></div>
            </>}
          </div>
        </section>

        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Sécurité</h2><p>Modifiez le mot de passe de votre compte.</p></div><LockKeyhole size={18} color="#6d28d9" /></header>
          <form className="dashboard-card__body dashboard-stack" onSubmit={(event) => void changePassword(event)}>
            <label className="dashboard-form-field">Mot de passe actuel<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required maxLength={128} /></label>
            <label className="dashboard-form-field">Nouveau mot de passe<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={10} maxLength={128} /><small>Au moins 10 caractères.</small></label>
            <label className="dashboard-form-field">Confirmer le nouveau mot de passe<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={10} maxLength={128} /></label>
            <button className="dashboard-button" type="submit" disabled={saving}><LockKeyhole size={15} />{saving ? "Modification…" : "Modifier le mot de passe"}</button>
          </form>
        </section>

        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Notifications</h2><p>Les notifications réelles sont disponibles dans votre espace.</p></div><Bell size={18} color="#6d28d9" /></header>
          <div className="dashboard-card__body"><Link className="dashboard-text-link" href="/dashboard/notifications">Consulter mes notifications</Link></div>
        </section>
      </div>
    </>
  );
}
