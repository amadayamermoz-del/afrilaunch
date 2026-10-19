import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardAuthenticatedRequest(
    `/notifications/${encodeURIComponent(id)}/read`,
    request,
    "PATCH",
  );
}
