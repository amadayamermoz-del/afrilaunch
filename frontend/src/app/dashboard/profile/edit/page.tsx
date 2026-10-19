"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { apiError, isAccountProfile, type AccountProfile } from "@/types/account-data";

export default function EditProfilePage() {
  const { user } = useAuthSession();
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [biography, setBiography] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(apiError(body, "Impossible de charger votre profil."));
        if (!isAccountProfile(body)) throw new Error("La réponse du serveur pour le profil est invalide.");
        return body;
      })
      .then((result) => {
        if (!active) return;
        setAccount(result);
        setName(result.name);
        setEmail(result.email);
        setPhone(result.profile?.phone ?? "");
        setLocation(result.profile?.location ?? "");
        setBiography(result.profile?.biography ?? "");
        setSkills(result.profile?.skills.join(", ") ?? "");
        setExperience(result.profile?.experience ?? "");
        const links = result.profile?.links ?? {};
        setLinkedin(typeof links.linkedin === "string" ? links.linkedin : "");
        setWebsite(typeof links.website === "string" ? links.website : "");
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Impossible de charger votre profil.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          location: location.trim() || null,
          biography: biography.trim() || null,
          skills: skills.split(",").map((skill) => skill.trim()).filter(Boolean),
          experience: experience.trim() || null,
          links: { linkedin: linkedin.trim(), website: website.trim() },
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body, "Impossible d’enregistrer votre profil."));
      const refreshed = await fetch("/api/profile", { cache: "no-store" });
      const refreshedBody: unknown = await refreshed.json();
      if (!refreshed.ok || !isAccountProfile(refreshedBody)) {
        throw new Error(apiError(refreshedBody, "Le profil a été enregistré, mais sa relecture a échoué."));
      }
      setAccount(refreshedBody);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible d’enregistrer votre profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DashboardPageHeader eyebrow="Mon compte" title="Modifier mon profil" description="Ces modifications seront enregistrées sur votre compte AfriLaunch." action={<Link className="dashboard-button dashboard-button--light" href="/dashboard/profile"><ArrowLeft size={15} /> Annuler</Link>} />
      {loading ? <div className="dashboard-empty" role="status">Chargement du profil…</div> : !account ? <p className="dashboard-form-error" role="alert">{error || `Impossible de charger le profil de ${user?.name ?? "cet utilisateur"}.`}</p> : (
        <form className="dashboard-card dashboard-wizard__form" onSubmit={handleSubmit}>
          <div className="dashboard-form-grid">
            <label className="dashboard-form-field">Nom complet<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></label>
            <label className="dashboard-form-field">Adresse e-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></label>
            <label className="dashboard-form-field">Téléphone<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} /></label>
            <label className="dashboard-form-field">Localisation<input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={160} /></label>
            <label className="dashboard-form-field dashboard-form-field--full">Biographie<textarea value={biography} onChange={(event) => setBiography(event.target.value)} maxLength={5000} rows={4} /></label>
            <label className="dashboard-form-field dashboard-form-field--full">Compétences<input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Séparez les compétences par des virgules" /></label>
            <label className="dashboard-form-field dashboard-form-field--full">Expérience<textarea value={experience} onChange={(event) => setExperience(event.target.value)} maxLength={10000} rows={4} placeholder="Une expérience par ligne" /></label>
            <label className="dashboard-form-field">Lien LinkedIn<input type="url" value={linkedin} onChange={(event) => setLinkedin(event.target.value)} /></label>
            <label className="dashboard-form-field">Site web<input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
          </div>
          {error && <p className="dashboard-form-error" role="alert">{error}</p>}
          {saved && <p className="dashboard-notice" role="status">Profil enregistré sur votre compte.</p>}
          <div className="dashboard-wizard__footer"><Link className="dashboard-button dashboard-button--light" href="/dashboard/profile">Annuler</Link><button className="dashboard-button" type="submit" disabled={saving}><Save size={15} />{saving ? "Enregistrement…" : "Enregistrer les modifications"}</button></div>
        </form>
      )}
    </>
  );
}
