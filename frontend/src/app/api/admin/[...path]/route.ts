import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

type AdminMethod = "GET" | "POST" | "PATCH" | "DELETE";

function resolveAdminRequest(path: string[], method: AdminMethod): string | null {
  const segments = path.map((segment) => decodeURIComponent(segment));
  const id = /^[a-zA-Z0-9_-]+$/;

  if (segments.length === 2 && segments[0] === "users" && method === "GET" && segments[1] === "list") {
    return "/admin/users";
  }
  if (segments.length === 2 && segments[0] === "users" && id.test(segments[1]) && method === "PATCH") {
    return `/admin/users/${segments[1]}`;
  }
  if (segments.length === 2 && segments[0] === "projects" && segments[1] === "list" && method === "GET") {
    return "/projects/admin";
  }
  if (segments.length === 3 && segments[0] === "projects" && id.test(segments[1]) && segments[2] === "status" && method === "PATCH") {
    return `/projects/${segments[1]}/status`;
  }
  if (segments.length === 2 && segments[0] === "applications" && segments[1] === "list" && method === "GET") {
    return "/applications/admin";
  }
  if (segments.length === 3 && segments[0] === "applications" && id.test(segments[1]) && segments[2] === "status" && method === "PATCH") {
    return `/applications/${segments[1]}/status`;
  }
  if (segments.length === 2 && segments[0] === "categories" && segments[1] === "list" && method === "GET") {
    return "/categories/admin";
  }
  if (segments.length === 1 && segments[0] === "categories" && method === "POST") {
    return "/categories";
  }
  if (segments.length === 2 && segments[0] === "categories" && id.test(segments[1]) && method === "PATCH") {
    return `/categories/${segments[1]}`;
  }
  if (segments.length === 2 && segments[0] === "categories" && id.test(segments[1]) && method === "DELETE") {
    return `/categories/${segments[1]}`;
  }
  if (segments.length === 2 && segments[0] === "opportunities" && segments[1] === "list" && method === "GET") {
    return "/opportunities/admin";
  }
  if (segments.length === 1 && segments[0] === "opportunities" && method === "POST") {
    return "/opportunities";
  }
  if (segments.length === 2 && segments[0] === "opportunities" && id.test(segments[1]) && method === "PATCH") {
    return `/opportunities/${segments[1]}`;
  }

  return null;
}

async function handle(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
  method: AdminMethod,
) {
  const { path } = await context.params;
  let backendPath: string | null;
  try {
    backendPath = resolveAdminRequest(path, method);
  } catch {
    backendPath = null;
  }
  if (!backendPath) {
    return Response.json({ message: "Admin API route not found" }, { status: 404 });
  }
  return forwardAuthenticatedRequest(backendPath, request, method);
}

export const GET = (request: Request, context: { params: Promise<{ path: string[] }> }) =>
  handle(request, context, "GET");
export const POST = (request: Request, context: { params: Promise<{ path: string[] }> }) =>
  handle(request, context, "POST");
export const PATCH = (request: Request, context: { params: Promise<{ path: string[] }> }) =>
  handle(request, context, "PATCH");
export const DELETE = (request: Request, context: { params: Promise<{ path: string[] }> }) =>
  handle(request, context, "DELETE");
