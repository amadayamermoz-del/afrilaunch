import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

type RouteContext = { params: Promise<{ id: string; milestoneId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id, milestoneId } = await context.params;
  return forwardAuthenticatedRequest(
    `/projects/${encodeURIComponent(id)}/milestones/${encodeURIComponent(milestoneId)}`,
    request,
    "PATCH",
  );
}
