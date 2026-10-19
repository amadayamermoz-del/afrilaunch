export type AccountProfile = {
  id: string;
  name: string;
  email: string;
  profile: {
    biography: string | null;
    phone: string | null;
    location: string | null;
    skills: string[];
    experience: string | null;
    links: Record<string, unknown>;
  } | null;
};

export type AccountDocument = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  project: { id: string; title: string } | null;
  downloadUrl: string;
};

export type AccountNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  readAt: string | null;
};

export function isAccountProfile(value: unknown): value is AccountProfile {
  if (!value || typeof value !== "object") return false;
  const user = value as Record<string, unknown>;
  if (
    typeof user.id !== "string" ||
    typeof user.name !== "string" ||
    typeof user.email !== "string"
  ) return false;
  if (user.profile === null) return true;
  if (typeof user.profile !== "object") return false;
  const profile = user.profile as Record<string, unknown>;
  return (
    (profile.biography === null || typeof profile.biography === "string") &&
    (profile.phone === null || typeof profile.phone === "string") &&
    (profile.location === null || typeof profile.location === "string") &&
    Array.isArray(profile.skills) &&
    profile.skills.every((skill) => typeof skill === "string") &&
    (profile.experience === null || typeof profile.experience === "string") &&
    typeof profile.links === "object" &&
    profile.links !== null &&
    !Array.isArray(profile.links)
  );
}

export function isAccountDocument(value: unknown): value is AccountDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Record<string, unknown>;
  return (
    typeof document.id === "string" &&
    typeof document.name === "string" &&
    typeof document.mimeType === "string" &&
    typeof document.sizeBytes === "number" &&
    typeof document.createdAt === "string" &&
    (document.project === null ||
      (typeof document.project === "object" &&
        document.project !== null &&
        "id" in document.project &&
        typeof document.project.id === "string" &&
        "title" in document.project &&
        typeof document.project.title === "string")) &&
    typeof document.downloadUrl === "string"
  );
}

export function isAccountNotification(
  value: unknown,
): value is AccountNotification {
  if (!value || typeof value !== "object") return false;
  const notification = value as Record<string, unknown>;
  return (
    typeof notification.id === "string" &&
    typeof notification.title === "string" &&
    typeof notification.message === "string" &&
    typeof notification.type === "string" &&
    typeof notification.createdAt === "string" &&
    (notification.readAt === null || typeof notification.readAt === "string")
  );
}

export function apiError(value: unknown, fallback: string): string {
  if (value && typeof value === "object" && "message" in value) {
    const message = value.message;
    if (Array.isArray(message)) return message.map(String).join(" ");
    if (typeof message === "string") return message;
  }
  return fallback;
}
