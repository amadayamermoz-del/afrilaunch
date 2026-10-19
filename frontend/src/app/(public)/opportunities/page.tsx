"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Filter,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  isOpportunity,
  responseError,
  type Opportunity,
} from "@/types/opportunity";

async function readOpportunities(response: Response): Promise<Opportunity[]> {
  const body: unknown = await response.json();
  if (!response.ok) {
    throw new Error(responseError(body, "Impossible de charger les opportunités."));
  }
  if (!Array.isArray(body) || !body.every(isOpportunity)) {
    throw new Error("La réponse du serveur pour les opportunités est invalide.");
  }
  return body;
}

function formatDate(value: string | null) {
  if (!value) return "Date limite non précisée";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedLocation, setSelectedLocation] = useState("ALL");
  const [visibleCount, setVisibleCount] = useState(6);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");
  const [needsAuthentication, setNeedsAuthentication] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/opportunities", { cache: "no-store" })
      .then(readOpportunities)
      .then((result) => {
        if (active) setOpportunities(result);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Impossible de charger les opportunités.",
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

  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          opportunities
            .filter((item) => item.category)
            .map((item) => [
              item.category!.id,
              item.category!.name,
            ] as const),
        ),
      ),
    [opportunities],
  );
  const locations = useMemo(
    () =>
      Array.from(
        new Set(
          opportunities
            .map((item) => item.location)
            .filter((location): location is string => Boolean(location)),
        ),
      ),
    [opportunities],
  );

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opportunity) => {
      const normalizedSearch = search.trim().toLocaleLowerCase("fr");
      const matchesSearch =
        !normalizedSearch ||
        `${opportunity.title} ${opportunity.organization} ${opportunity.description} ${opportunity.location ?? ""} ${opportunity.category?.name ?? ""}`
          .toLocaleLowerCase("fr")
          .includes(normalizedSearch);
      const matchesCategory =
        selectedCategory === "ALL" ||
        opportunity.categoryId === selectedCategory;
      const matchesLocation =
        selectedLocation === "ALL" || opportunity.location === selectedLocation;

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [opportunities, search, selectedCategory, selectedLocation]);

  const visibleOpportunities = filteredOpportunities.slice(0, visibleCount);
  const activeOpportunity = activeId
    ? opportunities.find((opportunity) => opportunity.id === activeId) ?? null
    : null;
  const organizationCount = new Set(
    opportunities.map((opportunity) => opportunity.organization),
  ).size;

  async function applyToOpportunity(opportunity: Opportunity) {
    setApplyingId(opportunity.id);
    setApplyError("");
    setApplySuccess("");
    setNeedsAuthentication(false);
    try {
      const response = await fetch(
        `/api/applications/opportunity/${encodeURIComponent(opportunity.id)}`,
        { method: "POST" },
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        setNeedsAuthentication(response.status === 401);
        throw new Error(
          responseError(body, "Impossible d'envoyer votre candidature."),
        );
      }
      setAppliedIds((current) => [...current, opportunity.id]);
      setApplySuccess("Votre candidature a été enregistrée.");
    } catch (submitError) {
      setApplyError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d'envoyer votre candidature.",
      );
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <main className="page-shell opportunities-page">
      <SiteHeader />

      <section className="opportunities-hero">
        <div className="container opportunities-hero__inner">
          <motion.div
            className="opportunities-hero__content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="eyebrow eyebrow--soft">Découvrir les bonnes opportunités</span>
            <h1>Des programmes, financements et partenariats conçus pour les projets qui veulent grandir.</h1>
            <p>
              Trouvez les appels à projets, accélérateurs, financements et réseaux qui correspondent à votre phase,
              votre marché et votre ambition.
            </p>
          </motion.div>

          <motion.div
            className="opportunities-hero__stats"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="hero-stat">
              <TrendingUp size={16} />
              <div>
                <strong>{loading || error ? "—" : opportunities.length}</strong>
                <span>opportunités publiées</span>
              </div>
            </div>
            <div className="hero-stat">
              <Sparkles size={16} />
              <div>
                <strong>{loading || error ? "—" : organizationCount}</strong>
                <span>organisations représentées</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="opportunities-discovery">
        <div className="container opportunities-discovery__layout">
          <aside className="filters-panel">
            <div className="filters-panel__header">
              <Filter size={16} />
              <span>Filtres</span>
            </div>

            <div className="filter-group">
              <label>Catégorie</label>
              <div className="filter-pills">
                <button
                  type="button"
                  className={selectedCategory === "ALL" ? "filter-pill is-active" : "filter-pill"}
                  onClick={() => setSelectedCategory("ALL")}
                >
                  Toutes
                </button>
                {categories.map(([categoryId, category]) => (
                  <button
                    key={categoryId}
                    type="button"
                    className={selectedCategory === categoryId ? "filter-pill is-active" : "filter-pill"}
                    onClick={() => setSelectedCategory(categoryId)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label>Localisation</label>
              <div className="filter-select-wrap">
                <select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)}>
                  <option value="ALL">Toutes</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          <div className="results-panel">
            <div className="results-panel__toolbar">
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setVisibleCount(6);
                  }}
                  placeholder="Rechercher une opportunité, une organisation ou un mot-clé"
                  aria-label="Rechercher une opportunité"
                />
              </div>

              <div className="results-meta">
                <strong>{loading || error ? "—" : filteredOpportunities.length}</strong>
                <span>résultats</span>
              </div>
            </div>

            <div className="results-grid">
              {visibleOpportunities.map((opportunity, index) => (
                <motion.article
                  key={opportunity.id}
                  className="opportunity-card"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -6 }}
                >
                  <div className="opportunity-card__top">
                    <span className="card-tag">
                      {opportunity.category?.name ?? "Sans catégorie"}
                    </span>
                  </div>

                  <div className="opportunity-card__body">
                    <h2>{opportunity.title}</h2>
                    <p className="organization">{opportunity.organization}</p>
                    <p className="description">{opportunity.description}</p>
                  </div>

                  <div className="opportunity-card__meta">
                    <div>
                      <MapPin size={14} />
                      <span>{opportunity.location ?? "Localisation non précisée"}</span>
                    </div>
                    <div>
                      <CalendarDays size={14} />
                      <span>{formatDate(opportunity.deadline)}</span>
                    </div>
                  </div>

                  <div className="opportunity-card__bottom">
                  <button type="button" className="inline-link" onClick={() => setActiveId(opportunity.id)} aria-label={`Voir le détail de ${opportunity.title}`}>
                      Voir le détail <ArrowUpRight size={15} />
                  </button>
                  </div>
                </motion.article>
              ))}
            </div>

            {loading && (
              <div className="empty-state" role="status">
                Chargement des opportunités…
              </div>
            )}

            {error && (
              <div className="empty-state" role="alert">
                <p>{error}</p>
                <button
                  type="button"
                  className="button"
                  onClick={() => window.location.reload()}
                >
                  Réessayer <ArrowRight size={16} />
                </button>
              </div>
            )}

            {visibleCount < filteredOpportunities.length && (
              <div className="load-more-wrap">
                <button
                  type="button"
                  className="button button-light load-more"
                  onClick={() => setVisibleCount((current) => current + 4)}
                >
                  Voir plus <ChevronRight size={16} />
                </button>
              </div>
            )}

            {!loading && !error && filteredOpportunities.length === 0 && (
              <div className="empty-state">
                <p>Aucune opportunité publiée ne correspond à ces critères pour le moment.</p>
                <button type="button" className="button" onClick={() => { setSearch(""); setSelectedCategory("ALL"); setSelectedLocation("ALL"); setVisibleCount(6); }}>
                  Réinitialiser <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {activeOpportunity && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveId(null)}>
          <motion.div className="modal-card" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{activeOpportunity.title}</h3>
                <p className="organization">{activeOpportunity.organization}</p>
              </div>
              <button className="modal-close" onClick={() => setActiveId(null)} aria-label="Fermer">✕</button>
            </div>

            <div className="modal-body">
              <p className="description">{activeOpportunity.description}</p>

              <div className="modal-meta">
                <div><MapPin size={14} /> <span>{activeOpportunity.location ?? "Localisation non précisée"}</span></div>
                <div><CalendarDays size={14} /> <span>{formatDate(activeOpportunity.deadline)}</span></div>
              </div>

              {activeOpportunity.eligibilityCriteria && (
                <div className="modal-eligibility">
                  <strong>Critères d&apos;éligibilité</strong>
                  <p>{activeOpportunity.eligibilityCriteria}</p>
                </div>
              )}

              {applyError && (
                <p role="alert" className="modal-feedback modal-feedback--error">
                  {applyError}
                  {needsAuthentication && (
                    <> <Link href="/login">Connectez-vous pour postuler.</Link></>
                  )}
                </p>
              )}
              {applySuccess && (
                <p role="status" className="modal-feedback modal-feedback--success">
                  {applySuccess}
                </p>
              )}

              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <button
                  className="button"
                  type="button"
                  onClick={() => void applyToOpportunity(activeOpportunity)}
                  disabled={applyingId === activeOpportunity.id || appliedIds.includes(activeOpportunity.id)}
                >
                  {applyingId === activeOpportunity.id
                    ? "Envoi…"
                    : appliedIds.includes(activeOpportunity.id)
                      ? "Candidature envoyée"
                      : "Postuler"}
                </button>
                <button className="button button-light" onClick={() => { setActiveId(null); }}>Fermer</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <SiteFooter />

      <style jsx global>{`
        .opportunities-page {
          background: #f8fafc;
          color: #0f172a;
        }

        .opportunities-hero {
          padding: 72px 0 32px;
          background:
            radial-gradient(circle at top left, rgba(109, 40, 217, 0.12), transparent 28%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(248, 250, 252, 0));
        }

        .opportunities-hero__inner {
          display: grid;
          grid-template-columns: 1.35fr 0.65fr;
          gap: 24px;
          align-items: end;
        }

        .opportunities-hero__content h1 {
          margin: 18px 0 14px;
          font-size: clamp(38px, 5vw, 60px);
          letter-spacing: -0.055em;
          line-height: 1.04;
          max-width: 780px;
        }

        .opportunities-hero__content p {
          margin: 0;
          max-width: 650px;
          color: #64748b;
          font-size: 17px;
          line-height: 1.75;
        }

        .opportunities-hero__stats {
          display: flex;
          flex-direction: column;
          gap: 16px;
          justify-self: end;
          width: min(100%, 300px);
        }

        .hero-stat {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 18px 20px;
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.04);
          color: #0f172a;
        }

        .hero-stat svg {
          color: #6d28d9;
          background: #f3e8ff;
          border-radius: 10px;
          padding: 8px;
        }

        .hero-stat strong {
          display: block;
          font-size: 26px;
          letter-spacing: -0.05em;
        }

        .hero-stat span {
          display: block;
          color: #64748b;
          font-size: 12px;
        }

        .opportunities-discovery {
          padding: 20px 0 88px;
        }

        .opportunities-discovery__layout {
          display: grid;
          grid-template-columns: 300px minmax(0, 1fr);
          gap: 28px;
          align-items: start;
        }

        .filters-panel,
        .results-panel,
        .opportunity-card,
        .empty-state {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.04);
        }

        .filters-panel {
          padding: 20px;
          position: sticky;
          top: 96px;
        }

        .filters-panel__header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        .filter-group {
          margin-top: 22px;
        }

        .filter-group label {
          display: block;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
        }

        .filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .filter-pill {
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #334155;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .filter-pill:hover {
          border-color: #c4b5fd;
          color: #6d28d9;
        }

        .filter-pill.is-active {
          background: #f3e8ff;
          border-color: #d8b4fe;
          color: #6d28d9;
        }

        .filter-select-wrap {
          position: relative;
        }

        .filter-select-wrap select {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #ffffff;
          color: #0f172a;
          font: inherit;
          outline: none;
        }

        .filter-select-wrap select:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.12);
        }

        .results-panel {
          padding: 20px;
        }

        .results-panel__toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 22px;
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          height: 48px;
          padding: 0 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
        }

        .search-box svg {
          color: #64748b;
        }

        .search-box input {
          flex: 1;
          border: 0;
          outline: none;
          background: transparent;
          color: #0f172a;
          font: inherit;
        }

        .search-box input::placeholder {
          color: #94a3b8;
        }

        .results-meta {
          display: flex;
          align-items: baseline;
          gap: 8px;
          color: #475569;
          font-size: 14px;
          white-space: nowrap;
        }

        .results-meta strong {
          font-size: 22px;
          color: #0f172a;
          letter-spacing: -0.04em;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .opportunity-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .opportunity-card:hover {
          box-shadow: 0 22px 36px rgba(15, 23, 42, 0.08);
        }

        .opportunity-card__top,
        .opportunity-card__bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .card-tag,
        .card-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 700;
        }

        .card-badge {
          background: #f8fafc;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .opportunity-card__body h2 {
          margin: 0;
          font-size: 24px;
          line-height: 1.15;
          letter-spacing: -0.04em;
        }

        .organization {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
        }

        .description {
          margin: 14px 0 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.7;
        }

        .opportunity-card__meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          padding-top: 14px;
          border-top: 1px solid #f1f5f9;
        }

        .opportunity-card__meta div {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 12px;
        }

        .opportunity-card__meta svg {
          color: #6d28d9;
        }

        .amount-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .amount-block span {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .amount-block strong {
          font-size: 18px;
          letter-spacing: -0.04em;
        }

        .inline-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: none;
          background: transparent;
          color: #6d28d9;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .load-more-wrap {
          display: flex;
          justify-content: center;
          padding-top: 22px;
        }

        .load-more {
          width: auto;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 34px 20px;
          margin-top: 18px;
          text-align: center;
        }

        .empty-state p {
          margin: 0;
          color: #475569;
          font-size: 16px;
        }

        @media (max-width: 980px) {
          .opportunities-hero__inner,
          .opportunities-discovery__layout,
          .results-grid {
            grid-template-columns: 1fr;
          }

          .opportunities-hero__stats {
            justify-self: start;
            width: 100%;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .filters-panel {
            position: static;
          }
        }

        @media (max-width: 620px) {
          .opportunities-hero {
            padding-top: 56px;
          }

          .opportunities-hero__content h1 {
            font-size: 38px;
          }

          .opportunities-hero__stats {
            grid-template-columns: 1fr;
          }

          .results-panel__toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .results-meta {
            justify-content: flex-start;
          }

          .opportunity-card__meta,
          .opportunity-card__bottom {
            grid-template-columns: 1fr;
            display: grid;
          }

          .opportunity-card__bottom {
            gap: 10px;
          }

          .filters-panel,
          .results-panel,
          .opportunity-card {
            border-radius: 16px;
          }
        }
      
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 60;
          padding: 20px;
        }

        .modal-card {
          width: min(920px, 100%);
          max-height: 90vh;
          overflow: auto;
          border-radius: 16px;
          box-shadow: 0 30px 60px rgba(2, 6, 23, 0.2);
          background: #fff;
          padding: 20px;
          border: 1px solid #e6eef8;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 12px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 20px;
        }

        .modal-close {
          border: none;
          background: transparent;
          font-size: 18px;
          cursor: pointer;
          color: #64748b;
          padding: 6px;
        }

        .modal-body {
          padding-top: 12px;
          color: #475569;
        }

        .modal-meta {
          display: flex;
          gap: 14px;
          margin-top: 12px;
          color: #64748b;
          align-items: center;
        }

        @media (max-width: 780px) {
          .modal-card { padding: 16px; border-radius: 12px; }
        }

      `}</style>
    </main>
  );
}
