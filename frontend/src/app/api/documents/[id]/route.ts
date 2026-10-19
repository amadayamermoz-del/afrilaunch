import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardAuthenticatedRequest(
    `/documents/${encodeURIComponent(id)}`,
    request,
    "DELETE",
  );
}
