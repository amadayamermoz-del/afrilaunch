"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Search } from "lucide-react";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import {
  APPLICATION_STATUS_LABELS,
  isApplication,
  responseError,
  type Application,
  type ApplicationStatus,
} from "@/types/opportunity";

const filters: Array<{ label: string; value: ApplicationStatus | "ALL" }> = [
  { label: "Tous les statuts", value: "ALL" },
  { label: "En attente", value: "PENDING" },
  { label: "En cours d'examen", value: "UNDER_REVIEW" },
  { label: "Acceptée", value: "ACCEPTED" },
  { label: "Refusée", value: "REJECTED" },
  { label: "Retirée", value: "WITHDRAWN" },
];

function isApplicationStatus(value: string): value is ApplicationStatus {
  return Object.hasOwn(APPLICATION_STATUS_LABELS, value);
}

function statusTone(status: ApplicationStatus) {
  if (status === "ACCEPTED") return "green";
  if (status === "REJECTED") return "red";
  if (status === "PENDING") return "orange";
  return "violet";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

async function readApplications(response: Response): Promise<Application[]> {
  const body: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      responseError(body, "Impossible de charger vos candidatures."),
    );
  }
  if (!Array.isArray(body) || !body.every(isApplication)) {
    throw new Error("La réponse du serveur pour les candidatures est invalide.");
  }
  return body;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ApplicationStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<Application | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/applications", { cache: "no-store" })
      .then(readApplications)
      .then((result) => {
        if (active) setApplications(result);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Impossible de charger vos candidatures.",
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

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    return applications.filter((application) => {
      const matchesSearch =
        !query ||
        `${application.opportunity.title} ${application.opportunity.organization} ${application.opportunity.category?.name ?? ""}`
          .toLocaleLowerCase("fr")
          .includes(query);
      return matchesSearch && (filter === "ALL" || application.status === filter);
    });
  }, [applications, filter, search]);

  async function withdraw(application: Application) {
    setPendingId(application.id);
    setActionError("");
    setActionMessage("");
    try {
      const response = await fetch(
        `/api/applications/${encodeURIComponent(application.id)}/withdraw`,
        { method: "POST" },
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          responseError(body, "Impossible de retirer cette candidature."),
        );
      }
      setApplications((current) =>
        current.map((item) =>
          item.id === application.id ? { ...item, status: "WITHDRAWN" } : item,
        ),
      );
      setSelected((current) =>
        current?.id === application.id
          ? { ...current, status: "WITHDRAWN" }
          : current,
      );
      setActionMessage("Votre candidature a été retirée.");
    } catch (withdrawError) {
      setActionError(
        withdrawError instanceof Error
          ? withdrawError.message
          : "Impossible de retirer cette candidature.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <DashboardPageHeader
        eyebrow="Suivi"
        title="Mes candidatures"
        description="Retrouvez l'état de vos dossiers et leurs mises à jour."
      />
      <div className="dashboard-toolbar">
        <div className="dashboard-toolbar__filters">
          <label className="dashboard-search">
            <Search size={15} />
            <input
              className="dashboard-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une candidature..."
              aria-label="Rechercher une candidature"
            />
          </label>
          <select
            className="dashboard-select"
            value={filter}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "ALL" || isApplicationStatus(value)) setFilter(value);
            }}
            aria-label="Filtrer par statut"
          >
            {filters.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <span style={{ color: "#64748b", fontSize: 11 }}>
          {loading ? "Chargement…" : `${filteredApplications.length} candidature${filteredApplications.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {loading ? (
        <div className="dashboard-empty" role="status">
          Chargement de vos candidatures…
        </div>
      ) : error ? (
        <div className="dashboard-empty" role="alert">
          <h2>Impossible de charger les candidatures</h2>
          <p>{error}</p>
          <button
            className="dashboard-button"
            type="button"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      ) : filteredApplications.length ? (
        <section className="dashboard-card">
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Opportunité</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Catégorie</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <div className="dashboard-table__title">
                        <strong>{application.opportunity.title}</strong>
                        <small>{application.opportunity.organization}</small>
                      </div>
                    </td>
                    <td>{formatDate(application.appliedAt)}</td>
                    <td>
                      <span
                        className={`dashboard-status dashboard-status--${statusTone(application.status)}`}
                      >
                        {APPLICATION_STATUS_LABELS[application.status]}
                      </span>
                    </td>
                    <td>
                      {application.opportunity.category?.name ?? "Sans catégorie"}
                    </td>
                    <td>
                      <button
                        className="dashboard-icon-button"
                        type="button"
                        onClick={() => {
                          setSelected(application);
                          setActionError("");
                          setActionMessage("");
                        }}
                        aria-label={`Consulter ${application.opportunity.title}`}
                      >
                        <ArrowUpRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : applications.length ? (
        <div className="dashboard-empty">
          <BriefcaseBusiness size={24} />
          <h2>Aucune candidature trouvée</h2>
          <p>Essayez un autre terme de recherche ou changez le filtre de statut.</p>
        </div>
      ) : (
        <div className="dashboard-empty">
          <BriefcaseBusiness size={24} />
          <h2>Pas encore de candidature</h2>
          <p>Explorez les opportunités publiées pour trouver celle qui vous correspond.</p>
          <Link className="dashboard-button" href="/opportunities">
            <ArrowRight size={14} /> Explorer les opportunités
          </Link>
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
            aria-labelledby="application-detail-title"
          >
            <span className="dashboard-eyebrow">Dossier de candidature</span>
            <h2 id="application-detail-title">
              {selected.opportunity.title}
            </h2>
            <p>{selected.opportunity.organization}</p>
            <div className="dashboard-row">
              <strong>Date de candidature</strong>
              <span>{formatDate(selected.appliedAt)}</span>
            </div>
            <div className="dashboard-row">
              <strong>Statut</strong>
              <span
                className={`dashboard-status dashboard-status--${statusTone(selected.status)}`}
              >
                {APPLICATION_STATUS_LABELS[selected.status]}
              </span>
            </div>
            {actionError && <p role="alert">{actionError}</p>}
            {actionMessage && <p role="status">{actionMessage}</p>}
            <div className="dashboard-confirm__actions">
              {(selected.status === "PENDING" ||
                selected.status === "UNDER_REVIEW") && (
                <button
                  className="dashboard-button dashboard-button--light"
                  type="button"
                  disabled={pendingId === selected.id}
                  onClick={() => void withdraw(selected)}
                >
                  {pendingId === selected.id
                    ? "Retrait…"
                    : "Retirer ma candidature"}
                </button>
              )}
              <button
                className="dashboard-button dashboard-button--light"
                type="button"
                onClick={() => setSelected(null)}
              >
                Fermer
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
