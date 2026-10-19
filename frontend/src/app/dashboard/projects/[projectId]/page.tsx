"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileText, Plus, ShieldCheck } from "lucide-react";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { apiError, isAccountDocument, type AccountDocument } from "@/types/account-data";
import {
  isProject,
  formatProjectActivity,
  PROJECT_PHASES,
  PROJECT_PHASE_LABELS,
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectPhase,
  type ProjectMilestone,
  type ProjectTask,
} from "@/types/project";

const phaseCriteria: Record<ProjectPhase, string> = {
  IDEA: "Définir le problème que le projet cherche à résoudre.",
  CONCEPT: "Renseigner une solution et le marché cible.",
  VALIDATE: "Créer et terminer au moins un jalon de validation.",
  PROTOTYPE: "Terminer tous les jalons de la phase prototype.",
  MVP: "Terminer tous les jalons de la phase MVP.",
  PRE_LAUNCH: "Terminer tous les jalons de préparation au lancement.",
  LAUNCH: "Terminer tous les jalons de lancement.",
  POST_LAUNCH: "Terminer tous les jalons post-lancement.",
};

function asIsoDate(value: FormDataEntryValue | null) {
  return value ? new Date(String(value)).toISOString() : null;
}

function displayDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value))
    : "Sans échéance";
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<AccountDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const loadProject = useCallback(async () => {
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" });
    const body: unknown = await response.json();
    if (!response.ok) throw new Error(apiError(body, "Impossible de charger ce projet."));
    if (!isProject(body)) throw new Error("La réponse du serveur pour le projet est invalide.");
    const documentsResponse = await fetch("/api/documents", { cache: "no-store" });
    const documentsBody: unknown = await documentsResponse.json();
    if (!documentsResponse.ok) throw new Error(apiError(documentsBody, "Impossible de charger les documents du projet."));
    if (!Array.isArray(documentsBody) || !documentsBody.every(isAccountDocument)) {
      throw new Error("La réponse du serveur pour les documents est invalide.");
    }
    return {
      project: body,
      documents: documentsBody.filter((document) => document.project?.id === projectId),
    };
  }, [projectId]);
  const refresh = useCallback(async () => {
    const result = await loadProject();
    setProject(result.project);
    setDocuments(result.documents);
  }, [loadProject]);

  useEffect(() => {
    let active = true;
    void loadProject()
      .then((result) => {
        if (active) {
          setProject(result.project);
          setDocuments(result.documents);
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Impossible de charger ce projet.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadProject]);

  const phaseIndex = project ? PROJECT_PHASES.indexOf(project.currentPhase) : 0;
  const progress = Math.round((phaseIndex / (PROJECT_PHASES.length - 1)) * 100);
  const nextMilestone = useMemo(
    () => project?.milestones?.filter((item) => item.status !== "COMPLETED" && item.dueDate)
      .sort((a, b) => Date.parse(a.dueDate ?? "") - Date.parse(b.dueDate ?? ""))[0],
    [project],
  );

  async function perform(path: string, method: string, body: unknown, success: string): Promise<boolean> {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(result, "La modification a échoué."));
      await refresh();
      setNotice(success);
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "La modification a échoué.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const created = await perform(`/api/projects/${encodeURIComponent(projectId)}/milestones`, "POST", {
      title: form.get("title"),
      description: form.get("description") || undefined,
      phase: form.get("phase"),
      dueDate: asIsoDate(form.get("dueDate")),
    }, "Le jalon a été enregistré.");
    if (created) {
      setShowMilestoneForm(false);
      formElement.reset();
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const created = await perform(`/api/projects/${encodeURIComponent(projectId)}/tasks`, "POST", {
      title: form.get("title"),
      description: form.get("description") || undefined,
      priority: form.get("priority"),
      dueDate: asIsoDate(form.get("dueDate")),
      milestoneId: form.get("milestoneId") || null,
    }, "La tâche a été enregistrée.");
    if (created) {
      setShowTaskForm(false);
      formElement.reset();
    }
  }

  if (loading) return <div className="dashboard-empty" role="status">Chargement du projet…</div>;
  if (!project) return <div className="dashboard-empty" role="alert"><h2>Projet indisponible</h2><p>{error || "Ce projet n’est pas accessible avec votre compte."}</p><Link className="dashboard-button dashboard-button--light" href="/dashboard/projects"><ArrowLeft size={15} /> Mes projets</Link></div>;

  const milestones = project.milestones ?? [];
  const tasks = project.tasks ?? [];

  return (
    <>
      <DashboardPageHeader eyebrow="Fiche projet" title={project.title} description={`${project.category?.name ?? "Sans catégorie"}${project.program ? ` · ${project.program}` : ""}`} action={<Link className="dashboard-button dashboard-button--light" href="/dashboard/projects"><ArrowLeft size={15} /> Mes projets</Link>} />
      {error && <p className="dashboard-form-error" role="alert">{error}</p>}
      {notice && <p className="dashboard-notice" role="status">{notice}</p>}
      <div className="dashboard-stack">
        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Vue d’ensemble</h2><p>Progression calculée à partir de la phase actuelle du cycle de vie (phase / 7).</p></div><span className="dashboard-status">{PROJECT_STATUS_LABELS[project.status]}</span></header>
          <div className="dashboard-card__body dashboard-profile-progress">
            <div className="dashboard-profile-progress__top"><span>Phase : {PROJECT_PHASE_LABELS[project.currentPhase]}</span><strong>{progress}%</strong></div>
            <div className="dashboard-progress" role="progressbar" aria-label="Progression du cycle de vie" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
            <p><strong>Prochain jalon :</strong> {nextMilestone ? `${nextMilestone.title} · ${displayDate(nextMilestone.dueDate)}` : "Aucun jalon futur enregistré."}</p>
          </div>
        </section>

        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Informations du projet</h2><p>Informations enregistrées dans votre espace.</p></div><Link className="dashboard-text-link" href={`/dashboard/projects/new?edit=${encodeURIComponent(project.id)}`}>Modifier <ArrowRight size={14} /></Link></header>
          <div className="dashboard-card__body">
            <p>{project.description}</p>
            {project.problem && <p><strong>Problème :</strong> {project.problem}</p>}
            {project.solution && <p><strong>Solution :</strong> {project.solution}</p>}
            {project.targetMarket && <p><strong>Public cible :</strong> {project.targetMarket}</p>}
            {project.valueProposition && <p><strong>Proposition de valeur :</strong> {project.valueProposition}</p>}
            <p><strong>Porteur :</strong> {project.owner?.name ?? "Vous"}</p>
          </div>
        </section>

        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Cycle de vie</h2><p>Huit phases. La phase suivante s’ouvre lorsque les critères backend sont satisfaits.</p></div></header>
          <div className="dashboard-card__body dashboard-stack">
            <div className="dashboard-wizard__steps" aria-label="Phases du projet">
              {PROJECT_PHASES.map((phase, index) => <div className={`dashboard-wizard__step${phase === project.currentPhase ? " is-active" : ""}${index < phaseIndex ? " is-done" : ""}`} key={phase}><span className="dashboard-wizard__step-number">{index < phaseIndex ? <Check size={13} /> : index + 1}</span><span>{PROJECT_PHASE_LABELS[phase]}</span></div>)}
            </div>
            <p><strong>Critère pour avancer :</strong> {phaseCriteria[project.currentPhase]}</p>
            <button className="dashboard-button" type="button" disabled={busy || phaseIndex === PROJECT_PHASES.length - 1} onClick={() => void perform(`/api/projects/${encodeURIComponent(project.id)}/advance-phase`, "POST", {}, "Le projet est passé à la phase suivante.")}>{phaseIndex === PROJECT_PHASES.length - 1 ? "Dernière phase atteinte" : `Avancer vers ${PROJECT_PHASE_LABELS[PROJECT_PHASES[phaseIndex + 1]]}`} <ArrowRight size={14} /></button>
          </div>
        </section>

        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Roadmap et jalons</h2><p>{milestones.length} jalon{milestones.length === 1 ? "" : "s"} enregistré{milestones.length === 1 ? "" : "s"}.</p></div><button className="dashboard-button dashboard-button--light" type="button" onClick={() => setShowMilestoneForm((visible) => !visible)}><Plus size={15} /> Ajouter un jalon</button></header>
          {showMilestoneForm && <form className="dashboard-card__body dashboard-stack" onSubmit={(event) => void createMilestone(event)}><label className="dashboard-form-field">Titre<input name="title" required minLength={2} maxLength={180} /></label><label className="dashboard-form-field">Phase<select name="phase" defaultValue={project.currentPhase}>{PROJECT_PHASES.map((phase) => <option key={phase} value={phase}>{PROJECT_PHASE_LABELS[phase]}</option>)}</select></label><label className="dashboard-form-field">Description<textarea name="description" maxLength={5000} rows={2} /></label><label className="dashboard-form-field">Échéance<input name="dueDate" type="date" /></label><button className="dashboard-button" disabled={busy} type="submit">Enregistrer le jalon</button></form>}
          <div className="dashboard-card__body dashboard-stack">{PROJECT_PHASES.map((phase) => {
            const phaseMilestones = milestones.filter((item) => item.phase === phase);
            return <div className="dashboard-setting-row dashboard-card" key={phase}><div><strong>{PROJECT_PHASE_LABELS[phase]}</strong>{phaseMilestones.length ? phaseMilestones.map((item) => <div className="dashboard-row" key={item.id}><div className="dashboard-row__copy"><strong>{item.title}</strong><span>{displayDate(item.dueDate)}</span></div><select className="dashboard-select" value={item.status} disabled={busy} aria-label={`Statut du jalon ${item.title}`} onChange={(event) => void perform(`/api/projects/${encodeURIComponent(project.id)}/milestones/${encodeURIComponent(item.id)}`, "PATCH", { status: event.target.value }, "Le statut du jalon a été mis à jour.")}><option value="PENDING">À faire</option><option value="IN_PROGRESS">En cours</option><option value="COMPLETED">Terminé</option></select></div>) : <p>Aucun jalon enregistré pour cette phase.</p>}</div></div>;
          })}</div>
        </section>

        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Tâches</h2><p>{tasks.filter((task) => task.status !== "DONE").length} tâche{tasks.filter((task) => task.status !== "DONE").length === 1 ? "" : "s"} restante{tasks.filter((task) => task.status !== "DONE").length === 1 ? "" : "s"}.</p></div><button className="dashboard-button dashboard-button--light" type="button" onClick={() => setShowTaskForm((visible) => !visible)}><Plus size={15} /> Ajouter une tâche</button></header>
          {showTaskForm && <form className="dashboard-card__body dashboard-stack" onSubmit={(event) => void createTask(event)}><label className="dashboard-form-field">Titre<input name="title" required minLength={2} maxLength={180} /></label><label className="dashboard-form-field">Description<textarea name="description" maxLength={5000} rows={2} /></label><label className="dashboard-form-field">Priorité<select name="priority" defaultValue="MEDIUM"><option value="LOW">Basse</option><option value="MEDIUM">Normale</option><option value="HIGH">Haute</option><option value="URGENT">Urgente</option></select></label><label className="dashboard-form-field">Jalon associé<select name="milestoneId" defaultValue=""><option value="">Aucun jalon</option>{milestones.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><label className="dashboard-form-field">Échéance<input name="dueDate" type="date" /></label><button className="dashboard-button" disabled={busy} type="submit">Enregistrer la tâche</button></form>}
          <div className="dashboard-card__body">{tasks.length ? tasks.map((task) => <TaskRow key={task.id} task={task} milestones={milestones} busy={busy} onUpdate={(patch) => void perform(`/api/projects/${encodeURIComponent(project.id)}/tasks/${encodeURIComponent(task.id)}`, "PATCH", patch, "La tâche a été mise à jour.")} />) : <p>Aucune tâche enregistrée pour ce projet.</p>}</div>
        </section>

        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Activité du projet</h2><p>Modifications enregistrées avec leur auteur et leur date.</p></div></header>
          <div className="dashboard-card__body">{project.activities?.length ? project.activities.map((activity) => <div className="dashboard-row" key={activity.id}><div className="dashboard-row__copy"><strong>{formatProjectActivity(activity)}</strong><span>{activity.actor?.name ?? "Compte supprimé"} · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.createdAt))}</span></div></div>) : <p>Aucune activité n’est encore enregistrée sur ce projet.</p>}</div>
        </section>

        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Documents du projet</h2><p>Fichiers réellement attachés à ce projet. Les versions et validations ne sont pas encore gérées.</p></div><FileText size={18} color="#6d28d9" /></header>
          <div className="dashboard-card__body">{documents.length ? documents.map((document) => <div className="dashboard-row" key={document.id}><div className="dashboard-row__copy"><strong>{document.name}</strong><span>{displayDate(document.createdAt)}</span></div><a className="dashboard-text-link" href={document.downloadUrl}>Télécharger</a></div>) : <p>Aucun document n’est attaché à ce projet. Ajoutez-en depuis la rubrique Documents.</p>}</div>
        </section>

        <section className="dashboard-card">
          <header className="dashboard-card__header"><div><h2>Équipe et collaboration</h2><p>Fonctionnalités non disponibles dans la version actuelle.</p></div><ShieldCheck size={18} color="#6d28d9" /></header>
          <div className="dashboard-card__body"><p>Le projet appartient à votre compte. Les rôles de membre, invitations, affectations, commentaires et recommandations nécessitent encore des modèles et permissions backend.</p></div>
        </section>
      </div>
    </>
  );
}

function TaskRow({ task, milestones, busy, onUpdate }: { task: ProjectTask; milestones: ProjectMilestone[]; busy: boolean; onUpdate: (patch: { status?: string; priority?: string }) => void }) {
  const milestone = milestones.find((item) => item.id === task.milestoneId);
  return <div className="dashboard-row"><div className="dashboard-row__copy"><strong>{task.title}</strong><span>{milestone?.title ?? "Sans jalon"} · {displayDate(task.dueDate)} · Priorité {task.priority.toLowerCase()}</span>{task.description && <small>{task.description}</small>}</div><select className="dashboard-select" value={task.status} disabled={busy} aria-label={`Statut de la tâche ${task.title}`} onChange={(event) => onUpdate({ status: event.target.value })}><option value="TODO">À faire</option><option value="IN_PROGRESS">En cours</option><option value="DONE">Terminé</option></select></div>;
}
