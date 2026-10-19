"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import {
  isProject,
  responseError,
  type Project,
  type ProjectCategory,
} from "@/types/project";

const steps = ["Informations générales", "Description du projet", "Récapitulatif"];

type ProjectDraft = {
  title: string;
  categoryId: string;
  description: string;
  problem: string;
  solution: string;
  targetMarket: string;
  valueProposition: string;
  program: string;
};

const emptyDraft: ProjectDraft = {
  title: "",
  categoryId: "",
  description: "",
  problem: "",
  solution: "",
  targetMarket: "",
  valueProposition: "",
  program: "",
};

const fieldLabels: Record<keyof ProjectDraft, string> = {
  title: "Nom du projet",
  categoryId: "Catégorie",
  description: "Description",
  problem: "Problème identifié",
  solution: "Solution proposée",
  targetMarket: "Marché cible",
  valueProposition: "Proposition de valeur",
  program: "Programme d'origine",
};

type CategoryResponse = Pick<ProjectCategory, "id" | "name" | "slug">;

function isCategory(value: unknown): value is CategoryResponse {
  if (!value || typeof value !== "object") return false;
  return (
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "slug" in value &&
    typeof value.slug === "string"
  );
}

function projectPayload(draft: ProjectDraft) {
  return {
    title: draft.title.trim(),
    categoryId: draft.categoryId || null,
    description: draft.description.trim(),
    problem: draft.problem.trim() || null,
    solution: draft.solution.trim() || null,
    targetMarket: draft.targetMarket.trim() || null,
    valueProposition: draft.valueProposition.trim() || null,
    program: draft.program.trim() || null,
  };
}

export default function NewProjectPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  useEffect(() => {
    let active = true;
    const projectId = new URLSearchParams(window.location.search).get("edit");

    async function loadFormData() {
      setLoading(true);
      setLoadError("");
      const categoryRequest = fetch("/api/categories", { cache: "no-store" })
        .then(async (response) => {
          const body: unknown = await response.json();
          if (!response.ok) {
            throw new Error(responseError(body, "Impossible de charger les catégories."));
          }
          if (!Array.isArray(body) || !body.every(isCategory)) {
            throw new Error("La réponse du serveur pour les catégories est invalide.");
          }
          return body;
        });

      try {
        const categoryResult = await categoryRequest;
        let project: Project | null = null;
        if (projectId) {
          const response = await fetch(
            `/api/projects/${encodeURIComponent(projectId)}`,
            { cache: "no-store" },
          );
          const body: unknown = await response.json();
          if (!response.ok || !isProject(body)) {
            throw new Error(
              responseError(body, "Impossible de charger ce projet."),
            );
          }
          if (body.status !== "DRAFT" && body.status !== "REJECTED") {
            throw new Error(
              "Seuls les brouillons et les projets refusés peuvent être modifiés.",
            );
          }
          project = body;
        }
        if (!active) return;
        setCategories(categoryResult);
        if (project) {
          setEditProject(project);
          setDraft({
            title: project.title,
            categoryId: project.categoryId ?? "",
            description: project.description,
            problem: project.problem ?? "",
            solution: project.solution ?? "",
            targetMarket: project.targetMarket ?? "",
            valueProposition: project.valueProposition ?? "",
            program: project.program ?? "",
          });
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Impossible de charger les données du formulaire.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadFormData();
    return () => {
      active = false;
    };
  }, []);

  const progress = useMemo(
    () => Math.round((step / (steps.length - 1)) * 100),
    [step],
  );

  function validateCurrentStep() {
    const requiredFields: Array<keyof ProjectDraft> =
      step === 0 ? ["title"] : step === 1 ? ["description"] : [];
    const invalidField = requiredFields.find((field) => {
      const value = draft[field].trim();
      return (
        !value ||
        (field === "title" && (value.length < 2 || value.length > 180)) ||
        (field === "description" &&
          (value.length < 20 || value.length > 10000))
      );
    });
    if (invalidField) {
      setFieldError(
        invalidField === "description" && draft.description.trim().length < 20
          ? "La description doit contenir au moins 20 caractères."
          : `${fieldLabels[invalidField]} est obligatoire et doit respecter les limites affichées.`,
      );
      return false;
    }
    setFieldError("");
    return true;
  }

  function nextStep() {
    if (validateCurrentStep() && step < steps.length - 1) {
      setStep((current) => current + 1);
      setFieldError("");
    }
  }

  function previousStep() {
    setStep((current) => Math.max(0, current - 1));
    setFieldError("");
  }

  async function saveProject(submitAfterSave: boolean) {
    setSubmitting(true);
    setActionError("");
    setConfirmSubmit(false);

    try {
      const response = await fetch(
        editProject
          ? `/api/projects/${encodeURIComponent(editProject.id)}`
          : "/api/projects",
        {
          method: editProject ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectPayload(draft)),
        },
      );
      const body: unknown = await response.json();
      if (!response.ok || !isProject(body)) {
        throw new Error(
          responseError(body, "L'enregistrement du projet a échoué."),
        );
      }
      setEditProject(body);

      if (submitAfterSave) {
        const submitResponse = await fetch(
          `/api/projects/${encodeURIComponent(body.id)}/submit`,
          { method: "POST" },
        );
        const submittedBody: unknown = await submitResponse.json();
        if (!submitResponse.ok || !isProject(submittedBody)) {
          throw new Error(
            `Le projet a été enregistré comme brouillon, mais sa soumission a échoué : ${responseError(submittedBody, "réponse invalide du serveur.")}`,
          );
        }
      }

      router.replace(`/dashboard/projects/${encodeURIComponent(body.id)}`);
    } catch (saveError) {
      setActionError(
        saveError instanceof Error
          ? saveError.message
          : "L'enregistrement du projet a échoué.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-empty" role="status">
        Chargement du formulaire…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="dashboard-empty" role="alert">
        <h2>Impossible de préparer le formulaire</h2>
        <p>{loadError}</p>
        <Link className="dashboard-button dashboard-button--light" href="/dashboard/projects">
          <ArrowLeft size={15} /> Retour à mes projets
        </Link>
      </div>
    );
  }

  return (
    <>
      <DashboardPageHeader
        eyebrow="Mes projets"
        title={editProject ? "Modifier le projet" : "Nouveau projet"}
        description={
          editProject
            ? "Mettez à jour les informations enregistrées sur votre projet."
            : "Renseignez les informations réelles de votre projet."
        }
        action={
          <Link
            className="dashboard-button dashboard-button--light"
            href="/dashboard/projects"
          >
            <ArrowLeft size={15} /> Mes projets
          </Link>
        }
      />

      <div className="dashboard-wizard__progress">
        <span>
          Étape {step + 1} sur {steps.length} · {steps[step]}
        </span>
        <strong>{progress}%</strong>
      </div>
      <div
        className="dashboard-progress"
        role="progressbar"
        aria-label="Progression de la création du projet"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="dashboard-wizard" style={{ marginTop: 16 }}>
        <nav className="dashboard-card dashboard-wizard__steps" aria-label="Étapes de création du projet">
          {steps.map((label, index) => (
            <div
              className={`dashboard-wizard__step${index === step ? " is-active" : ""}${index < step ? " is-done" : ""}`}
              key={label}
              aria-current={index === step ? "step" : undefined}
            >
              <span className="dashboard-wizard__step-number">
                {index < step ? <Check size={13} /> : index + 1}
              </span>
              <span>{label}</span>
            </div>
          ))}
        </nav>

        <section className="dashboard-card dashboard-wizard__form">
          <h2>{steps[step]}</h2>
          {step === 0 && (
            <div className="dashboard-form-grid">
              <label className="dashboard-form-field dashboard-form-field--full">
                {fieldLabels.title} <span aria-hidden="true">*</span>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  maxLength={180}
                  aria-invalid={Boolean(fieldError && !draft.title.trim())}
                />
                <small>{draft.title.length}/180 caractères</small>
              </label>
              <label className="dashboard-form-field dashboard-form-field--full">
                {fieldLabels.categoryId}
                <select
                  value={draft.categoryId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      categoryId: event.target.value,
                    }))
                  }
                >
                  <option value="">Sans catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {step === 1 && (
            <div className="dashboard-form-grid">
              <label className="dashboard-form-field dashboard-form-field--full">
                {fieldLabels.description} <span aria-hidden="true">*</span>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  minLength={20}
                  maxLength={10000}
                  rows={5}
                  aria-invalid={Boolean(
                    fieldError && draft.description.trim().length < 20,
                  )}
                />
                <small>{draft.description.length}/10000 caractères (20 minimum)</small>
              </label>
              {(
                ["problem", "solution", "targetMarket", "valueProposition"] as const
              ).map((field) => (
                <label
                  className="dashboard-form-field dashboard-form-field--full"
                  key={field}
                >
                  {fieldLabels[field]}
                  <textarea
                    value={draft[field]}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    maxLength={field === "targetMarket" ? 5000 : 10000}
                    rows={3}
                  />
                </label>
              ))}
              <label className="dashboard-form-field dashboard-form-field--full">
                {fieldLabels.program}
                <input
                  value={draft.program}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, program: event.target.value }))
                  }
                  maxLength={180}
                  placeholder="Programme ou dispositif d'accompagnement (facultatif)"
                />
              </label>
            </div>
          )}
          {step === 2 && (
            <div className="dashboard-stack">
              {(
                ["title", "description", "problem", "solution", "targetMarket", "valueProposition", "program"] as const
              ).map((field) => (
                <div className="dashboard-setting-row dashboard-card" key={field}>
                  <div>
                    <strong>{fieldLabels[field]}</strong>
                    <p>{draft[field].trim() || "Non renseigné"}</p>
                  </div>
                </div>
              ))}
              <div className="dashboard-setting-row dashboard-card">
                <div>
                  <strong>{fieldLabels.categoryId}</strong>
                  <p>
                    {categories.find((category) => category.id === draft.categoryId)
                      ?.name ?? "Sans catégorie"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {fieldError && (
            <p className="dashboard-form-error" role="alert">
              {fieldError}
            </p>
          )}
          {actionError && (
            <p className="dashboard-form-error" role="alert">
              {actionError}
            </p>
          )}

          <div className="dashboard-wizard__footer">
            <button
              className="dashboard-button dashboard-button--light"
              type="button"
              onClick={previousStep}
              disabled={step === 0 || submitting}
            >
              Précédent
            </button>
            {step < steps.length - 1 ? (
              <button
                className="dashboard-button"
                type="button"
                onClick={nextStep}
              >
                Continuer <ArrowRight size={15} />
              </button>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button
                  className="dashboard-button dashboard-button--light"
                  type="button"
                  onClick={() => void saveProject(false)}
                  disabled={submitting}
                >
                  <Save size={15} />
                  {submitting ? "Enregistrement…" : "Enregistrer le brouillon"}
                </button>
                {(editProject?.status === "DRAFT" ||
                  editProject?.status === "REJECTED" ||
                  !editProject) && (
                  <button
                    className="dashboard-button"
                    type="button"
                    onClick={() => setConfirmSubmit(true)}
                    disabled={submitting}
                  >
                    Enregistrer et soumettre <ArrowRight size={15} />
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {confirmSubmit && (
        <div
          className="dashboard-confirm-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmSubmit(false);
          }}
        >
          <section
            className="dashboard-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-project-title"
          >
            <h2 id="submit-project-title">Enregistrer et soumettre le projet ?</h2>
            <p>
              Le projet sera enregistré dans votre compte puis transmis à
              l’équipe de modération.
            </p>
            <div className="dashboard-confirm__actions">
              <button
                className="dashboard-button dashboard-button--light"
                type="button"
                onClick={() => setConfirmSubmit(false)}
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                className="dashboard-button"
                type="button"
                onClick={() => void saveProject(true)}
                disabled={submitting}
              >
                {submitting ? "Enregistrement…" : "Confirmer"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
