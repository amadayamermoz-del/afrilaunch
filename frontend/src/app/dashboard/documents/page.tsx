"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Search, Trash2, UploadCloud } from "lucide-react";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { isProject, type Project } from "@/types/project";
import {
  apiError,
  isAccountDocument,
  type AccountDocument,
} from "@/types/account-data";

function formatSize(size: number) {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}

export default function DocumentsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<AccountDocument[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");
  const [projectLoadError, setProjectLoadError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadDocuments() {
    const response = await fetch("/api/documents", { cache: "no-store" });
    const body: unknown = await response.json();
    if (!response.ok) throw new Error(apiError(body, "Impossible de charger vos documents."));
    if (!Array.isArray(body) || !body.every(isAccountDocument)) throw new Error("La réponse du serveur pour les documents est invalide.");
    setDocuments(body);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/projects", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(apiError(body, "Impossible de charger vos projets."));
        if (!Array.isArray(body) || !body.every(isProject)) {
          throw new Error("La réponse du serveur pour les projets est invalide.");
        }
        return body;
      })
      .then((result) => { if (active) setProjects(result); })
      .catch((loadError: unknown) => {
        if (active) setProjectLoadError(loadError instanceof Error ? loadError.message : "Impossible de charger vos projets.");
      });
    fetch("/api/documents", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(apiError(body, "Impossible de charger vos documents."));
        if (!Array.isArray(body) || !body.every(isAccountDocument)) throw new Error("La réponse du serveur pour les documents est invalide.");
        return body;
      })
      .then((result) => { if (active) setDocuments(result); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : "Impossible de charger vos documents."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredDocuments = useMemo(() => documents.filter((document) =>
    `${document.name} ${document.mimeType} ${document.project?.title ?? ""}`.toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr")),
  ), [documents, search]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    if (selectedProjectId) form.set("projectId", selectedProjectId);
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/documents", { method: "POST", body: form });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body, "Impossible d’envoyer le document."));
      if (!isAccountDocument(body)) throw new Error("Le serveur a renvoyé un document invalide.");
      setDocuments((current) => [body, ...current]);
      setNotice("Document envoyé et enregistré sur votre compte.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Impossible d’envoyer le document.");
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  async function deleteDocument(document: AccountDocument) {
    if (!window.confirm(`Supprimer définitivement « ${document.name} » ?`)) return;
    setPendingId(document.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/documents/${encodeURIComponent(document.id)}`, { method: "DELETE" });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body, "Impossible de supprimer ce document."));
      await loadDocuments();
      setNotice("Document supprimé de votre compte.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Impossible de supprimer ce document.");
    } finally {
      setPendingId("");
    }
  }

  return (
    <>
      <DashboardPageHeader eyebrow="Votre bibliothèque" title="Documents" description="Consultez et gérez les fichiers réellement enregistrés sur votre compte." />
      <section className="dashboard-document-upload">
        <span><UploadCloud size={20} /></span>
        <div><strong>Ajouter un document</strong><p>PDF, Word, JPEG ou PNG. Taille maximale : 10 Mo. Les fichiers sont téléversés sur le serveur sécurisé.</p></div>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png" onChange={(event) => void handleUpload(event)} aria-label="Choisir un document à envoyer" disabled={uploading} />
      </section>
      {error && <p className="dashboard-form-error" role="alert">{error}</p>}
      {projectLoadError && <p className="dashboard-form-error" role="alert">{projectLoadError}</p>}
      {notice && <p className="dashboard-notice" role="status">{notice}</p>}
      <div className="dashboard-toolbar" style={{ marginTop: 18 }}>
        <label className="dashboard-search"><Search size={15} /><input className="dashboard-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un document..." aria-label="Rechercher un document" /></label>
        <label className="dashboard-form-field">Associer à un projet
          <select className="dashboard-select" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={uploading || Boolean(projectLoadError)}>
            <option value="">Aucun projet</option>
            {projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}
          </select>
        </label>
        <button className="dashboard-button" type="button" onClick={() => inputRef.current?.click()} disabled={uploading}><UploadCloud size={15} />{uploading ? "Envoi…" : "Ajouter un fichier"}</button>
      </div>
      {loading ? <div className="dashboard-empty" role="status">Chargement des documents…</div> : filteredDocuments.length ? (
        <div className="dashboard-documents-grid">
          {filteredDocuments.map((document) => (
            <article className="dashboard-card dashboard-document-card" key={document.id}>
              <div className="dashboard-document-card__top"><span className="dashboard-document-card__icon"><FileText size={19} /></span><span className="dashboard-status">{document.mimeType.split("/").pop()?.toUpperCase() ?? "FICHIER"}</span></div>
              <h2>{document.name}</h2><p>Projet : {document.project?.title ?? "Non associé"}</p>
              <div className="dashboard-document-card__meta"><span>{formatDate(document.createdAt)}</span><span>{formatSize(document.sizeBytes)}</span></div>
              <div className="dashboard-project-card__actions">
                <a className="dashboard-button dashboard-button--light" href={document.downloadUrl} target="_blank" rel="noreferrer">Télécharger</a>
                <button className="dashboard-icon-button dashboard-icon-button--danger" type="button" onClick={() => void deleteDocument(document)} disabled={pendingId === document.id} aria-label={`Supprimer ${document.name}`}><Trash2 size={15} /></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty"><FileText size={24} /><h2>{documents.length ? "Aucun document trouvé" : "Aucun document enregistré"}</h2><p>{documents.length ? "Essayez avec un autre nom, type ou projet." : "Les documents envoyés apparaîtront ici après leur enregistrement."}</p></div>
      )}
    </>
  );
}
