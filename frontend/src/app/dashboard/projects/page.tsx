"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import {
  isProject,
  PROJECT_STATUS_LABELS,
  responseError,
  type Project,
  type ProjectPhase,
  type ProjectStatus,
  PROJECT_PHASES,
  PROJECT_PHASE_LABELS,
} from "@/types/project";

const filters: Array<{ label: string; value: ProjectStatus | "ALL" }> = [
  { label: "Tous les statuts", value: "ALL" },
  { label: "Brouillon", value: "DRAFT" },
  { label: "Soumis", value: "SUBMITTED" },
  { label: "En cours d'examen", value: "UNDER_REVIEW" },
  { label: "Approuvé", value: "APPROVED" },
  { label: "Refusé", value: "REJECTED" },
  { label: "Publié", value: "PUBLISHED" },
];

function statusTone(status: ProjectStatus) {
  if (status === "PUBLISHED" || status === "APPROVED") return "green";
  if (status === "SUBMITTED" || status === "UNDER_REVIEW") return "violet";
  if (status === "REJECTED") return "red";
  return "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

async function readProjects(response: Response): Promise<Project[]> {
  const body: unknown = await response.json();
  if (!response.ok) {
    throw new Error(responseError(body, "Impossible de charger les projets."));
  }
  if (!Array.isArray(body) || !body.every(isProject)) {
    throw new Error("La réponse du serveur pour les projets est invalide.");
  }
  return body;
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="dashboard-empty" role="status">Chargement des projets…</div>}>
      <ProjectsContent />
    </Suspense>
  );
}

function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [phase, setPhase] = useState<ProjectPhase | "ALL">("ALL");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const [selected, setSelected] = useState<Project | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/projects", { cache: "no-store" })
      .then(readProjects)
      .then((result) => {
        if (active) setProjects(result);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Impossible de charger les projets.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function reloadProjects() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      setProjects(await readProjects(response));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger les projets.",
      );
    } finally {
      setLoading(false);
    }
  }

  function retryLoad() {
    void reloadProjects();
  }

  const filteredProjects = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("fr");
    return projects
      .filter((project) => {
        const matchesSearch =
          !normalized ||
          `${project.title} ${project.description} ${project.category?.name ?? ""}`
            .toLocaleLowerCase("fr")
            .includes(normalized);
        return (
          matchesSearch &&
          (status === "ALL" || project.status === status) &&
          (phase === "ALL" || project.currentPhase === phase)
        );
      })
      .sort((a, b) =>
        sort === "recent"
          ? Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
          : Date.parse(a.updatedAt) - Date.parse(b.updatedAt),
      );
  }, [projects, search, status, phase, sort]);

  async function deleteProject() {
    if (!pendingDelete) return;
    setPendingAction(pendingDelete.id);
    setActionError("");
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(pendingDelete.id)}`, {
        method: "DELETE",
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        throw new Error(responseError(body, "La suppression du projet a échoué."));
      }
      setProjects((current) =>
        current.filter((project) => project.id !== pendingDelete.id),
      );
      setPendingDelete(null);
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : "La suppression du projet a échoué.",
      );
    } finally {
      setPendingAction("");
    }
  }

  async function submitProject(project: Project) {
    setPendingAction(project.id);
    setActionError("");
    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(project.id)}/submit`,
        { method: "POST" },
      );
      const body: unknown = await response.json();
      if (!response.ok || !isProject(body)) {
        throw new Error(
          responseError(body, "La soumission du projet a échoué."),
        );
      }
      setProjects((current) =>
        current.map((item) => (item.id === body.id ? body : item)),
      );
      setSelected((current) => (current?.id === body.id ? body : current));
    } catch (submitError) {
      setActionError(
        submitError instanceof Error
          ? submitError.message
          : "La soumission du projet a échoué.",
      );
    } finally {
      setPendingAction("");
    }
  }

  return (
    <>
      <DashboardPageHeader
        eyebrow="Votre espace de travail"
        title="Mes projets"
        description="Consultez et gérez les projets enregistrés dans votre compte."
        action={
          <Link className="dashboard-button" href="/dashboard/projects/new">
            <Plus size={16} /> Nouveau projet
          </Link>
        }
      />

      <div className="dashboard-toolbar">
        <div className="dashboard-toolbar__filters">
          <label className="dashboard-search">
            <Search size={15} />
            <input
              className="dashboard-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un projet..."
              aria-label="Rechercher un projet"
            />
          </label>
          <select
            className="dashboard-select"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ProjectStatus | "ALL")
            }
            aria-label="Filtrer par statut"
          >
            {filters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
          <select
            className="dashboard-select"
            value={phase}
            onChange={(event) =>
              setPhase(event.target.value as ProjectPhase | "ALL")
            }
            aria-label="Filtrer par phase de développement"
          >
            <option value="ALL">Toutes les phases</option>
            {PROJECT_PHASES.map((item) => (
              <option key={item} value={item}>{PROJECT_PHASE_LABELS[item]}</option>
            ))}
          </select>
          <select
            className="dashboard-select"
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as "recent" | "oldest")
            }
            aria-label="Trier les projets"
          >
            <option value="recent">Plus récents</option>
            <option value="oldest">Plus anciens</option>
          </select>
        </div>
        {!loading && !error && (
          <span style={{ color: "#64748b", fontSize: 11 }}>
            {filteredProjects.length} projet
            {filteredProjects.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {actionError && (
        <p className="dashboard-notice" role="alert">
          {actionError}
        </p>
      )}
      {loading ? (
        <div className="dashboard-empty" role="status">
          Chargement des projets…
        </div>
      ) : error ? (
        <div className="dashboard-empty" role="alert">
          <h2>Impossible de charger les projets</h2>
          <p>{error}</p>
          <button className="dashboard-button" type="button" onClick={retryLoad}>
            Réessayer
          </button>
        </div>
      ) : filteredProjects.length ? (
        <div className="dashboard-project-list">
          {filteredProjects.map((project) => (
            <article className="dashboard-card dashboard-project-card" key={project.id}>
              <div className="dashboard-project-card__top">
                <div className="dashboard-project-card__title">
                  <span className="dashboard-row__mark">
                    {project.title.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <h2>{project.title}</h2>
                    <p>
                      {project.category?.name ?? "Sans catégorie"} · Mis à jour
                      le {formatDate(project.updatedAt)}
                    </p>
                    <span className="dashboard-status dashboard-status--violet">
                      {PROJECT_PHASE_LABELS[project.currentPhase]}
                    </span>
                  </div>
                </div>
                <span
                  className={`dashboard-status dashboard-status--${statusTone(project.status)}`}
                >
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
              </div>
              <p className="dashboard-project-card__description">
                {project.description}
              </p>
              <div className="dashboard-project-card__actions">
                <Link
                  className="dashboard-button dashboard-button--light"
                  href={`/dashboard/projects/${encodeURIComponent(project.id)}`}
                >
                  Ouvrir le projet <ArrowRight size={14} />
                </Link>
                <button
                  className="dashboard-icon-button"
                  type="button"
                  onClick={() => setSelected(project)}
                  aria-label={`Consulter ${project.title}`}
                >
                  <Eye size={15} />
                </button>
                {(project.status === "DRAFT" || project.status === "REJECTED") && (
                  <>
                    <Link
                      className="dashboard-icon-button"
                      href={`/dashboard/projects/new?edit=${encodeURIComponent(project.id)}`}
                      aria-label={`Modifier ${project.title}`}
                    >
                      <Pencil size={15} />
                    </Link>
                    {project.status === "DRAFT" && (
                      <button
                        className="dashboard-button"
                        type="button"
                        disabled={pendingAction === project.id}
                        onClick={() => void submitProject(project)}
                      >
                        {pendingAction === project.id ? "Soumission…" : "Soumettre"}
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </>
                )}
                {project.status === "DRAFT" && (
                  <button
                    className="dashboard-icon-button dashboard-icon-button--danger"
                    type="button"
                    onClick={() => setPendingDelete(project)}
                    aria-label={`Supprimer ${project.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty">
          <Search size={24} />
          <h2>{projects.length ? "Aucun projet trouvé" : "Aucun projet"}</h2>
          <p>
            {projects.length
              ? "Essayez de modifier votre recherche ou le filtre de statut."
              : "Aucun projet n'est encore enregistré pour votre compte."}
          </p>
          {!projects.length && (
            <Link className="dashboard-button" href="/dashboard/projects/new">
              <Plus size={15} /> Créer un projet
            </Link>
          )}
        </div>
      )}

      {selected && (
        <div
          className="dashboard-confirm-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section
            className="dashboard-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-detail-title"
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <span className="dashboard-eyebrow">
                  {selected.category?.name ?? "Sans catégorie"}
                </span>
                <h2 id="project-detail-title" style={{ marginTop: 7 }}>
                  {selected.title}
                </h2>
              </div>
              <button
                className="dashboard-icon-button"
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.7 }}>
              {selected.description}
            </p>
            {selected.problem && <p><strong>Problème :</strong> {selected.problem}</p>}
            {selected.solution && <p><strong>Solution :</strong> {selected.solution}</p>}
            {selected.targetMarket && <p><strong>Marché cible :</strong> {selected.targetMarket}</p>}
            <div className="dashboard-row">
              <strong>Statut</strong>
              <span className={`dashboard-status dashboard-status--${statusTone(selected.status)}`}>
                {PROJECT_STATUS_LABELS[selected.status]}
              </span>
            </div>
            <div className="dashboard-confirm__actions">
              <button
                className="dashboard-button dashboard-button--light"
                type="button"
                onClick={() => setSelected(null)}
              >
                Fermer
              </button>
              {(selected.status === "DRAFT" || selected.status === "REJECTED") && (
                <Link
                  className="dashboard-button"
                  href={`/dashboard/projects/new?edit=${encodeURIComponent(selected.id)}`}
                >
                  <Pencil size={14} /> Modifier <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </section>
        </div>
      )}

      {pendingDelete && (
        <div
          className="dashboard-confirm-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPendingDelete(null);
          }}
        >
          <section
            className="dashboard-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Supprimer « {pendingDelete.title} » ?</h2>
            <p>Le brouillon sera supprimé définitivement de votre compte.</p>
            <div className="dashboard-confirm__actions">
              <button
                className="dashboard-button dashboard-button--light"
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={pendingAction === pendingDelete.id}
              >
                Annuler
              </button>
              <button
                className="dashboard-button dashboard-button--danger"
                type="button"
                onClick={() => void deleteProject()}
                disabled={pendingAction === pendingDelete.id}
              >
                {pendingAction === pendingDelete.id ? "Suppression…" : "Supprimer le projet"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
