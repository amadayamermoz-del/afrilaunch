export type ProjectStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED";

export type ProjectPhase =
  | "IDEA"
  | "CONCEPT"
  | "VALIDATE"
  | "PROTOTYPE"
  | "MVP"
  | "PRE_LAUNCH"
  | "LAUNCH"
  | "POST_LAUNCH";

export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ProjectActivityType =
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "PROJECT_SUBMITTED"
  | "PROJECT_STATUS_CHANGED"
  | "PHASE_ADVANCED"
  | "MILESTONE_CREATED"
  | "MILESTONE_UPDATED"
  | "TASK_CREATED"
  | "TASK_UPDATED";

export type ProjectActivity = {
  id: string;
  projectId: string;
  type: ProjectActivityType;
  message: string;
  createdAt: string;
  actor: { id: string; name: string } | null;
};

export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  phase: ProjectPhase;
  status: MilestoneStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tasks?: ProjectTask[];
};

export type ProjectTask = {
  id: string;
  projectId: string;
  milestoneId: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectCategory = {
  id: string;
  name: string;
  slug: string;
};

export type Project = {
  id: string;
  ownerId: string;
  categoryId: string | null;
  title: string;
  description: string;
  problem: string | null;
  solution: string | null;
  targetMarket: string | null;
  valueProposition: string | null;
  program: string | null;
  currentPhase: ProjectPhase;
  status: ProjectStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: ProjectCategory | null;
  owner?: { id: string; name: string };
  milestones?: ProjectMilestone[];
  tasks?: ProjectTask[];
  activities?: ProjectActivity[];
};

export const PROJECT_PHASES: ProjectPhase[] = [
  "IDEA",
  "CONCEPT",
  "VALIDATE",
  "PROTOTYPE",
  "MVP",
  "PRE_LAUNCH",
  "LAUNCH",
  "POST_LAUNCH",
];

export const PROJECT_PHASE_LABELS: Record<ProjectPhase, string> = {
  IDEA: "Idea",
  CONCEPT: "Concept",
  VALIDATE: "Validate",
  PROTOTYPE: "Prototype",
  MVP: "MVP",
  PRE_LAUNCH: "Pre-Launch",
  LAUNCH: "Launch",
  POST_LAUNCH: "Post-Launch",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Soumis",
  UNDER_REVIEW: "En cours d'examen",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
  PUBLISHED: "Publié",
};

export function formatProjectActivity(activity: ProjectActivity): string {
  if (activity.type === "PROJECT_STATUS_CHANGED") {
    const status = activity.message.split(": ").at(-1) as ProjectStatus;
    return `Statut du projet mis à jour : ${PROJECT_STATUS_LABELS[status] ?? status}`;
  }
  if (activity.type === "PHASE_ADVANCED") {
    const phases = activity.message.split(": ").at(-1)?.split(" → ");
    if (phases?.length === 2) {
      const [previous, next] = phases as [ProjectPhase, ProjectPhase];
      return `Phase avancée : ${PROJECT_PHASE_LABELS[previous] ?? previous} → ${PROJECT_PHASE_LABELS[next] ?? next}`;
    }
  }
  return activity.message;
}

export function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const project = value as Record<string, unknown>;
  return (
    typeof project.id === "string" &&
    typeof project.ownerId === "string" &&
    typeof project.title === "string" &&
    typeof project.description === "string" &&
    typeof project.status === "string" &&
    project.status in PROJECT_STATUS_LABELS &&
    typeof project.currentPhase === "string" &&
    PROJECT_PHASES.includes(project.currentPhase as ProjectPhase) &&
    typeof project.updatedAt === "string" &&
    (project.milestones === undefined ||
      (Array.isArray(project.milestones) &&
        project.milestones.every(isProjectMilestone))) &&
    (project.tasks === undefined ||
      (Array.isArray(project.tasks) && project.tasks.every(isProjectTask))) &&
    (project.activities === undefined ||
      (Array.isArray(project.activities) &&
        project.activities.every(isProjectActivity))) &&
    (project.category === null ||
      (typeof project.category === "object" &&
        project.category !== null &&
        "id" in project.category &&
        typeof project.category.id === "string" &&
        "name" in project.category &&
        typeof project.category.name === "string" &&
        "slug" in project.category &&
        typeof project.category.slug === "string"))
  );
}

function isProjectActivity(value: unknown): value is ProjectActivity {
  if (!value || typeof value !== "object") return false;
  const activity = value as Record<string, unknown>;
  const actor = activity.actor;
  return (
    typeof activity.id === "string" &&
    typeof activity.projectId === "string" &&
    [
      "PROJECT_CREATED",
      "PROJECT_UPDATED",
      "PROJECT_SUBMITTED",
      "PROJECT_STATUS_CHANGED",
      "PHASE_ADVANCED",
      "MILESTONE_CREATED",
      "MILESTONE_UPDATED",
      "TASK_CREATED",
      "TASK_UPDATED",
    ].includes(String(activity.type)) &&
    typeof activity.message === "string" &&
    typeof activity.createdAt === "string" &&
    (actor === null ||
      (typeof actor === "object" &&
        actor !== null &&
        "id" in actor &&
        typeof actor.id === "string" &&
        "name" in actor &&
        typeof actor.name === "string"))
  );
}

function isProjectMilestone(value: unknown): value is ProjectMilestone {
  if (!value || typeof value !== "object") return false;
  const milestone = value as Record<string, unknown>;
  return (
    typeof milestone.id === "string" &&
    typeof milestone.projectId === "string" &&
    typeof milestone.title === "string" &&
    (milestone.description === null || typeof milestone.description === "string") &&
    typeof milestone.phase === "string" &&
    PROJECT_PHASES.includes(milestone.phase as ProjectPhase) &&
    ["PENDING", "IN_PROGRESS", "COMPLETED"].includes(String(milestone.status)) &&
    (milestone.dueDate === null || typeof milestone.dueDate === "string") &&
    (milestone.completedAt === null || typeof milestone.completedAt === "string") &&
    typeof milestone.createdAt === "string" &&
    typeof milestone.updatedAt === "string"
  );
}

function isProjectTask(value: unknown): value is ProjectTask {
  if (!value || typeof value !== "object") return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.id === "string" &&
    typeof task.projectId === "string" &&
    (task.milestoneId === null || typeof task.milestoneId === "string") &&
    typeof task.title === "string" &&
    (task.description === null || typeof task.description === "string") &&
    ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(String(task.priority)) &&
    ["TODO", "IN_PROGRESS", "DONE"].includes(String(task.status)) &&
    (task.dueDate === null || typeof task.dueDate === "string") &&
    (task.completedAt === null || typeof task.completedAt === "string") &&
    typeof task.createdAt === "string" &&
    typeof task.updatedAt === "string"
  );
}

export function responseError(value: unknown, fallback: string): string {
  if (
    value &&
    typeof value === "object" &&
    "message" in value
  ) {
    const message = value.message;
    if (Array.isArray(message)) {
      return message.map(String).join(" ");
    }
    if (typeof message === "string") {
      return message;
    }
  }
  return fallback;
}
