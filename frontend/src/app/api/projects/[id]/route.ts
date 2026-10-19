import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return forwardAuthenticatedRequest(
    `/projects/${encodeURIComponent(id)}`,
    request,
    "GET",
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return forwardAuthenticatedRequest(
    `/projects/${encodeURIComponent(id)}`,
    request,
    "PATCH",
  );
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return forwardAuthenticatedRequest(
    `/projects/${encodeURIComponent(id)}`,
    request,
    "DELETE",
  );
}
