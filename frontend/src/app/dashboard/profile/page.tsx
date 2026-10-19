"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Globe2,
  MapPin,
  Pencil,
  UserRound,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import {
  apiError,
  isAccountProfile,
  type AccountProfile,
} from "@/types/account-data";

export default function ProfilePage() {
  const { user } = useAuthSession();
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(apiError(body, "Impossible de charger votre profil."));
        if (!isAccountProfile(body)) throw new Error("La réponse du serveur pour le profil est invalide.");
        return body;
      })
      .then((result) => { if (active) setAccount(result); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Impossible de charger votre profil.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const profile = account?.profile;
  const skills = profile?.skills ?? [];
  const experience = profile?.experience?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
  const links = profile?.links ?? {};
  const linkEntries = Object.entries(links).filter(([, value]) => typeof value === "string" && value.length > 0);
  const profileFields = [
    account?.name,
    account?.email,
    profile?.biography,
    profile?.location,
    skills.length ? skills.join("") : "",
    profile?.experience,
    profile?.phone,
    ...linkEntries.map(([, value]) => value),
  ];
  const completion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
  const initials = (account?.name ?? user?.name ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  return (
    <>
      <DashboardPageHeader
        eyebrow="Votre identité"
        title="Mon profil"
        description="Consultez et mettez à jour les informations de votre compte."
        action={<Link className="dashboard-button" href="/dashboard/profile/edit"><Pencil size={15} /> Modifier le profil</Link>}
      />
      {error && <p className="dashboard-form-error" role="alert">{error}</p>}
      {loading ? <div className="dashboard-empty" role="status">Chargement du profil…</div> : account && (
        <>
          <div className="dashboard-profile-grid">
            <section className="dashboard-card dashboard-profile-card">
              <span className="dashboard-profile-avatar">{initials}</span>
              <h2>{account.name}</h2>
              <p>{account.email}</p>
              {profile?.location && <span className="dashboard-profile-card__location"><MapPin size={13} /> {profile.location}</span>}
              <div className="dashboard-profile-card__meter">
                <div><span>Profil complété</span><strong>{completion}%</strong></div>
                <div className="dashboard-progress" role="progressbar" aria-label="Profil complété" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${completion}%` }} /></div>
              </div>
            </section>
            <div className="dashboard-stack">
              <section className="dashboard-card">
                <header className="dashboard-card__header"><h2>À propos</h2><UserRound size={17} color="#6d28d9" /></header>
                <div className="dashboard-card__body"><p className="dashboard-profile-bio">{profile?.biography || "Aucune biographie renseignée."}</p></div>
              </section>
              <section className="dashboard-card">
                <header className="dashboard-card__header"><h2>Compétences</h2><BriefcaseBusiness size={17} color="#6d28d9" /></header>
                <div className="dashboard-card__body">{skills.length ? <div className="dashboard-chip-list">{skills.map((skill) => <span className="dashboard-chip" key={skill}>{skill}</span>)}</div> : <p className="dashboard-profile-bio">Aucune compétence renseignée.</p>}</div>
              </section>
              <section className="dashboard-card">
                <header className="dashboard-card__header"><h2>Expérience</h2></header>
                <div className="dashboard-card__body">{experience.length ? <div className="dashboard-experience">{experience.map((item) => <div className="dashboard-experience__item" key={item}><span className="dashboard-experience__dot" /><div><strong>{item}</strong></div></div>)}</div> : <p className="dashboard-profile-bio">Aucune expérience renseignée.</p>}</div>
              </section>
              <section className="dashboard-card">
                <header className="dashboard-card__header"><h2>Liens professionnels</h2><Globe2 size={17} color="#6d28d9" /></header>
                <div className="dashboard-card__body dashboard-stack">
                  {linkEntries.length ? linkEntries.map(([label, value]) => <div className="dashboard-row" key={label}><div className="dashboard-row__copy"><strong>{label}</strong><span>{String(value)}</span></div><ArrowUpRight size={14} color="#94a3b8" /></div>) : <p className="dashboard-profile-bio">Aucun lien professionnel renseigné.</p>}
                  {profile?.phone && <div className="dashboard-row"><div className="dashboard-row__copy"><strong>Téléphone</strong><span>{profile.phone}</span></div></div>}
                </div>
              </section>
            </div>
          </div>
          {!profile && <p className="dashboard-notice">Votre profil complémentaire n’a pas encore été renseigné. Utilisez « Modifier le profil » pour l’ajouter.</p>}
        </>
      )}
    </>
  );
}
