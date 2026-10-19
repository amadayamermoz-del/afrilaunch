export type OpportunityStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export type ApplicationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export type OpportunityCategory = {
  id: string;
  name: string;
  slug: string;
};

export type Opportunity = {
  id: string;
  categoryId: string | null;
  title: string;
  organization: string;
  description: string;
  location: string | null;
  eligibilityCriteria: string;
  deadline: string | null;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
  category: OpportunityCategory | null;
};

export type Application = {
  id: string;
  userId: string;
  opportunityId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  opportunity: Pick<Opportunity, "id" | "title" | "organization" | "category">;
};

export function isOpportunity(value: unknown): value is Opportunity {
  if (!value || typeof value !== "object") return false;
  const opportunity = value as Record<string, unknown>;
  return (
    typeof opportunity.id === "string" &&
    typeof opportunity.title === "string" &&
    typeof opportunity.organization === "string" &&
    typeof opportunity.description === "string" &&
    (opportunity.location === null ||
      typeof opportunity.location === "string") &&
    typeof opportunity.eligibilityCriteria === "string" &&
    (opportunity.deadline === null ||
      typeof opportunity.deadline === "string") &&
    typeof opportunity.status === "string" &&
    ["DRAFT", "PUBLISHED", "CLOSED"].includes(opportunity.status) &&
    (opportunity.category === null ||
      (typeof opportunity.category === "object" &&
        opportunity.category !== null &&
        "id" in opportunity.category &&
        typeof opportunity.category.id === "string" &&
        "name" in opportunity.category &&
        typeof opportunity.category.name === "string" &&
        "slug" in opportunity.category &&
        typeof opportunity.category.slug === "string"))
  );
}

export function isApplication(value: unknown): value is Application {
  if (!value || typeof value !== "object") return false;
  const application = value as Record<string, unknown>;
  const opportunity = application.opportunity;
  return (
    typeof application.id === "string" &&
    typeof application.userId === "string" &&
    typeof application.opportunityId === "string" &&
    typeof application.status === "string" &&
    [
      "PENDING",
      "UNDER_REVIEW",
      "ACCEPTED",
      "REJECTED",
      "WITHDRAWN",
    ].includes(application.status) &&
    typeof application.appliedAt === "string" &&
    typeof application.updatedAt === "string" &&
    typeof opportunity === "object" &&
    opportunity !== null &&
    "id" in opportunity &&
    typeof opportunity.id === "string" &&
    "title" in opportunity &&
    typeof opportunity.title === "string" &&
    "organization" in opportunity &&
    typeof opportunity.organization === "string" &&
    "category" in opportunity &&
    (opportunity.category === null ||
      (typeof opportunity.category === "object" &&
        opportunity.category !== null &&
        "id" in opportunity.category &&
        typeof opportunity.category.id === "string" &&
        "name" in opportunity.category &&
        typeof opportunity.category.name === "string" &&
        "slug" in opportunity.category &&
        typeof opportunity.category.slug === "string"))
  );
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: "En attente",
  UNDER_REVIEW: "En cours d'examen",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
  WITHDRAWN: "Retirée",
};

export function responseError(value: unknown, fallback: string): string {
  if (value && typeof value === "object" && "message" in value) {
    const message = value.message;
    if (Array.isArray(message)) return message.map(String).join(" ");
    if (typeof message === "string") return message;
  }
  return fallback;
}
