import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

type RouteContext = { params: Promise<{ id: string; taskId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id, taskId } = await context.params;
  return forwardAuthenticatedRequest(
    `/projects/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}`,
    request,
    "PATCH",
  );
}
