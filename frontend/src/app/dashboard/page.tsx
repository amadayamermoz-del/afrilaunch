"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  FolderKanban,
  ListTodo,
  PackageCheck,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import {
  APPLICATION_STATUS_LABELS,
  isApplication,
  isOpportunity,
  responseError as opportunityResponseError,
  type Application,
  type Opportunity,
} from "@/types/opportunity";
import {
  isProject,
  formatProjectActivity,
  PROJECT_STATUS_LABELS,
  responseError,
  type Project,
} from "@/types/project";
import { PROJECT_PHASE_LABELS } from "@/types/project";
import { apiError, isAccountProfile, type AccountProfile } from "@/types/account-data";

function statusTone(status: string) {
  if (
    status === "PUBLISHED" ||
    status === "ACCEPTED" ||
    status === "Publié" ||
    status === "Acceptée"
  ) return "green";
  if (status === "UNDER_REVIEW" || status === "En cours d'examen") return "violet";
  if (status === "PENDING") return "orange";
  if (status === "REJECTED" || status === "Refusé") return "red";
  return "";
}

export default function DashboardPage() {
  const { user } = useAuthSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(true);
  const [opportunitiesError, setOpportunitiesError] = useState("");
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      try {
        const response = await fetch("/api/projects", { cache: "no-store" });
        const body: unknown = await response.json();
        if (!response.ok) {
          throw new Error(responseError(body, "Impossible de charger les projets."));
        }
        if (!Array.isArray(body) || !body.every(isProject)) {
          throw new Error("La réponse du serveur pour les projets est invalide.");
        }
        if (active) setProjects(body);
      } catch (error) {
        if (active) {
          setProjectsError(
            error instanceof Error
              ? error.message
              : "Impossible de charger les projets.",
          );
        }
      } finally {
        if (active) setProjectsLoading(false);
      }
    }
    void loadProjects();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/applications", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            opportunityResponseError(
              body,
              "Impossible de charger les candidatures.",
            ),
          );
        }
        if (!Array.isArray(body) || !body.every(isApplication)) {
          throw new Error("La réponse du serveur pour les candidatures est invalide.");
        }
        return body;
      })
      .then((result) => {
        if (active) setApplications(result);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setApplicationsError(
            loadError instanceof Error
              ? loadError.message
              : "Impossible de charger les candidatures.",
          );
        }
      })
      .finally(() => {
        if (active) setApplicationsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/opportunities", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            opportunityResponseError(
              body,
              "Impossible de charger les opportunités.",
            ),
          );
        }
        if (!Array.isArray(body) || !body.every(isOpportunity)) {
          throw new Error("La réponse du serveur pour les opportunités est invalide.");
        }
        return body;
      })
      .then((result) => {
        if (active) setOpportunities(result);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setOpportunitiesError(
            loadError instanceof Error
              ? loadError.message
              : "Impossible de charger les opportunités.",
          );
        }
      })
      .finally(() => {
        if (active) setOpportunitiesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(apiError(body, "Impossible de charger votre profil."));
        if (!isAccountProfile(body)) throw new Error("La réponse du serveur pour le profil est invalide.");
        return body;
      })
      .then((result) => { if (active) setProfile(result); })
      .catch((loadError: unknown) => {
        if (active) setProfileError(loadError instanceof Error ? loadError.message : "Impossible de charger votre profil.");
      })
      .finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, []);

  const profileChecklist = [
    { label: "Informations personnelles", complete: Boolean(profile?.name && profile.email) },
    { label: "Biographie et localisation", complete: Boolean(profile?.profile?.biography && profile.profile.location) },
    { label: "Compétences", complete: Boolean(profile?.profile?.skills.length) },
    { label: "Ajouter une expérience", complete: Boolean(profile?.profile?.experience) },
  ];
  const profileCompletion = profile
    ? Math.round((profileChecklist.filter((item) => item.complete).length / profileChecklist.length) * 100)
    : null;
  const allTasks = projects.flatMap((project) => project.tasks ?? []);
  const allMilestones = projects.flatMap((project) => project.milestones ?? []);
  const recentActivities = projects.flatMap((project) =>
    (project.activities ?? []).map((activity) => ({ activity, project })),
  ).sort((a, b) => Date.parse(b.activity.createdAt) - Date.parse(a.activity.createdAt)).slice(0, 5);
  const activeProjects = projects.filter((project) =>
    ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "PUBLISHED"].includes(project.status),
  );
  const upcomingDeadlines = projects.flatMap((project) => [
    ...(project.tasks ?? [])
      .filter((task) => task.dueDate && task.status !== "DONE")
      .map((task) => ({ id: `task-${task.id}`, title: task.title, type: "Tâche", dueDate: task.dueDate as string, project })),
    ...(project.milestones ?? [])
      .filter((milestone) => milestone.dueDate && milestone.status !== "COMPLETED")
      .map((milestone) => ({ id: `milestone-${milestone.id}`, title: milestone.title, type: "Jalon", dueDate: milestone.dueDate as string, project })),
  ]).filter((item) => Date.parse(item.dueDate) >= new Date().setHours(0, 0, 0, 0))
    .sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate))
    .slice(0, 5);

  return (
    <>
      <DashboardPageHeader
        eyebrow="Votre espace de travail"
        title={`Bonjour, ${user?.name.split(/\s+/)[0] ?? ""} 👋`}
        description="Voici un aperçu de votre activité sur AfriLaunch."
        action={<Link className="dashboard-button" href="/dashboard/projects/new"><Plus size={16} /> Créer un projet</Link>}
      />

      <section className="dashboard-grid" aria-label="Statistiques de votre espace">
        <article className="dashboard-card dashboard-stat">
          <span className="dashboard-stat__icon dashboard-stat__icon--violet"><FolderKanban size={18} /></span>
          <div className="dashboard-stat__content">
            <span>Mes projets</span>
            <strong>{projectsLoading || projectsError ? "—" : projects.length}</strong>
            <small>
              {projectsLoading
                ? "Chargement depuis votre compte"
                : projectsError
                  ? "Indisponible"
                  : "Projets enregistrés"}
            </small>
          </div>
        </article>
        <article className="dashboard-card dashboard-stat">
          <span className="dashboard-stat__icon dashboard-stat__icon--orange"><BriefcaseBusiness size={18} /></span>
          <div className="dashboard-stat__content">
            <span>Mes candidatures</span>
            <strong>{applicationsLoading || applicationsError ? "—" : applications.length}</strong>
            <small>{applicationsLoading ? "Chargement depuis votre compte" : applicationsError ? "Indisponible" : "Dossiers enregistrés"}</small>
          </div>
        </article>
        <article className="dashboard-card dashboard-stat">
          <span className="dashboard-stat__icon dashboard-stat__icon--green"><Target size={18} /></span>
          <div className="dashboard-stat__content">
            <span>Opportunités ouvertes</span>
            <strong>{opportunitiesLoading || opportunitiesError ? "—" : opportunities.length}</strong>
            <small>{opportunitiesLoading ? "Chargement des offres" : opportunitiesError ? "Indisponible" : "Offres publiées"}</small>
          </div>
        </article>
        <article className="dashboard-card dashboard-stat">
          <span className="dashboard-stat__icon dashboard-stat__icon--violet"><FolderKanban size={18} /></span>
          <div className="dashboard-stat__content"><span>Projets actifs</span><strong>{projectsLoading || projectsError ? "—" : activeProjects.length}</strong><small>Soumis, en examen, approuvés ou publiés</small></div>
        </article>
        <article className="dashboard-card dashboard-stat">
          <span className="dashboard-stat__icon dashboard-stat__icon--orange"><ListTodo size={18} /></span>
          <div className="dashboard-stat__content"><span>Tâches en cours</span><strong>{projectsLoading || projectsError ? "—" : allTasks.filter((task) => task.status === "IN_PROGRESS").length}</strong><small>Dans vos projets</small></div>
        </article>
        <article className="dashboard-card dashboard-stat">
          <span className="dashboard-stat__icon dashboard-stat__icon--green"><Check size={18} /></span>
          <div className="dashboard-stat__content"><span>Jalons atteints</span><strong>{projectsLoading || projectsError ? "—" : allMilestones.filter((milestone) => milestone.status === "COMPLETED").length}</strong><small>Jalons terminés</small></div>
        </article>
        <article className="dashboard-card dashboard-stat">
          <span className="dashboard-stat__icon dashboard-stat__icon--orange"><PackageCheck size={18} /></span>
          <div className="dashboard-stat__content"><span>Livrables à valider</span><strong>—</strong><small>Validation non prise en charge</small></div>
        </article>
      </section>

      <div className="dashboard-columns">
        <div className="dashboard-stack">
          <section className="dashboard-card">
            <header className="dashboard-card__header">
              <div><h2>Mes projets récents</h2><p>Continuez là où vous en étiez.</p></div>
              <Link className="dashboard-text-link" href="/dashboard/projects" aria-label="Voir tous mes projets">Tout voir <ArrowRight size={14} /></Link>
            </header>
            <div className="dashboard-card__body">
              {projectsLoading ? (
                <div className="dashboard-empty" role="status">Chargement des projets…</div>
              ) : projectsError ? (
                <div className="dashboard-empty" role="alert">
                  <h2>Impossible de charger les projets</h2>
                  <p>{projectsError}</p>
                </div>
              ) : projects.length ? projects.slice(0, 2).map((project) => (
                <article className="dashboard-row" key={project.id}>
                  <span className="dashboard-row__mark">{project.title.slice(0, 2).toUpperCase()}</span>
                  <div className="dashboard-row__copy"><Link href={`/dashboard/projects/${encodeURIComponent(project.id)}`}><strong>{project.title}</strong></Link><span>{project.category?.name ?? "Sans catégorie"} · {PROJECT_PHASE_LABELS[project.currentPhase]} · Modifié le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(project.updatedAt))}</span></div>
                  <span className={`dashboard-status dashboard-status--${statusTone(PROJECT_STATUS_LABELS[project.status])}`}>{PROJECT_STATUS_LABELS[project.status]}</span>
                </article>
              )) : <div className="dashboard-empty"><FolderKanban size={20} /><h2>Pas encore de projet</h2><p>Aucun projet n&apos;est encore enregistré pour votre compte.</p><Link className="dashboard-button" href="/dashboard/projects/new"><Plus size={14} /> Créer un projet</Link></div>}
            </div>
          </section>

          <section className="dashboard-card">
            <header className="dashboard-card__header">
              <div><h2>Suivi des candidatures</h2><p>Les prochaines étapes de vos dossiers.</p></div>
              <Link className="dashboard-text-link" href="/dashboard/applications" aria-label="Voir toutes les candidatures">Tout voir <ArrowRight size={14} /></Link>
            </header>
            <div className="dashboard-card__body">
              {applicationsLoading ? (
                <div className="dashboard-empty" role="status">Chargement des candidatures…</div>
              ) : applicationsError ? (
                <div className="dashboard-empty" role="alert">
                  <h2>Impossible de charger les candidatures</h2>
                  <p>{applicationsError}</p>
                </div>
              ) : applications.length ? applications.slice(0, 2).map((application) => (
                <article className="dashboard-row" key={application.id}>
                  <span className="dashboard-row__mark"><BriefcaseBusiness size={16} /></span>
                  <div className="dashboard-row__copy"><strong>{application.opportunity.title}</strong><span>{application.opportunity.organization} · déposée le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(application.appliedAt))}</span></div>
                  <span className={`dashboard-status dashboard-status--${statusTone(application.status)}`}>{APPLICATION_STATUS_LABELS[application.status]}</span>
                </article>
              )) : <div className="dashboard-empty"><BriefcaseBusiness size={20} /><h2>Pas encore de candidature</h2><p>Explorez les opportunités pour trouver celle qui vous correspond.</p><Link className="dashboard-button" href="/opportunities"><ArrowRight size={14} /> Explorer</Link></div>}
            </div>
          </section>
        </div>

        <div className="dashboard-stack">
          <section className="dashboard-card">
            <header className="dashboard-card__header"><div><h2>Actions rapides</h2><p>Un petit pas peut tout débloquer.</p></div></header>
            <div className="dashboard-card__body dashboard-quick-actions">
              <Link href="/dashboard/projects/new"><Plus size={16} /> Créer un nouveau projet <ArrowUpRight size={14} /></Link>
              <Link href="/opportunities"><Target size={16} /> Explorer les opportunités <ArrowUpRight size={14} /></Link>
              <Link href="/dashboard/profile/edit"><Sparkles size={16} /> Compléter mon profil <ArrowUpRight size={14} /></Link>
            </div>
          </section>

          <section className="dashboard-card">
            <header className="dashboard-card__header"><div><h2>Progression du profil</h2><p>Votre profil aide à mieux vous orienter.</p></div></header>
            <div className="dashboard-card__body dashboard-profile-progress">
              {profileLoading ? <p role="status">Chargement du profil…</p> : profileError ? <p role="alert">{profileError}</p> : profileCompletion !== null ? <>
                <div className="dashboard-profile-progress__top"><span>Complété</span><strong>{profileCompletion}%</strong></div>
                <div className="dashboard-progress" role="progressbar" aria-label="Progression du profil" aria-valuenow={profileCompletion} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${profileCompletion}%` }} /></div>
                <ul>{profileChecklist.map((item) => <li key={item.label}>{item.complete ? <Check size={14} /> : <span className="dashboard-unread-dot" />} {item.label}</li>)}</ul>
              </> : null}
            </div>
          </section>

          <section className="dashboard-card">
            <header className="dashboard-card__header"><div><h2>Pour vous</h2><p>Des opportunités à découvrir.</p></div></header>
            <div className="dashboard-card__body">
              {opportunitiesLoading ? (
                <div className="dashboard-empty" role="status">Chargement des opportunités…</div>
              ) : opportunitiesError ? (
                <div className="dashboard-empty" role="alert"><p>{opportunitiesError}</p></div>
              ) : opportunities.length ? opportunities.slice(0, 2).map((opportunity) => (
                <article className="dashboard-opportunity" key={opportunity.id}>
                  <span>{opportunity.category?.name ?? "Sans catégorie"}</span><strong>{opportunity.title}</strong><p>{opportunity.organization}{opportunity.location ? ` · ${opportunity.location}` : ""}</p>
                </article>
              )) : (
                <div className="dashboard-empty">Aucune opportunité publiée actuellement.</div>
              )}
              <Link className="dashboard-text-link" href="/opportunities">Toutes les opportunités <ArrowRight size={14} /></Link>
            </div>
          </section>
        </div>
      </div>
      <div className="dashboard-columns" style={{ marginTop: 18 }}>
        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Prochaines échéances</h2><p>Tâches et jalons à venir dans vos projets.</p></div><CalendarDays size={18} color="#6d28d9" /></header>
          {projectsLoading ? <div className="dashboard-empty" role="status">Chargement des échéances…</div> : projectsError ? <p className="dashboard-form-error" role="alert">{projectsError}</p> : upcomingDeadlines.length ? upcomingDeadlines.map((item) => <div className="dashboard-row" key={item.id}><CalendarDays size={16} /><div className="dashboard-row__copy"><Link href={`/dashboard/projects/${encodeURIComponent(item.project.id)}`}><strong>{item.title}</strong></Link><span>{item.type} · {item.project.title} · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(item.dueDate))}</span></div></div>) : <p className="dashboard-empty">Aucune échéance à venir n’est enregistrée.</p>}
        </section>
        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Activité récente</h2><p>Historique des événements de projet.</p></div></header>
          <div className="dashboard-card__body">
            {projectsLoading ? <p role="status">Chargement de l’activité…</p> : projectsError ? <p role="alert">{projectsError}</p> : recentActivities.length ? recentActivities.map(({ activity, project }) => (
              <article className="dashboard-row" key={activity.id}>
                <span className="dashboard-row__mark"><Check size={16} /></span>
                <div className="dashboard-row__copy">
                  <Link href={`/dashboard/projects/${encodeURIComponent(project.id)}`}><strong>{formatProjectActivity(activity)}</strong></Link>
                  <span>{project.title} · {activity.actor?.name ?? "Compte supprimé"} · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.createdAt))}</span>
                </div>
              </article>
            )) : <p>Aucune activité n’est encore enregistrée sur vos projets.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
