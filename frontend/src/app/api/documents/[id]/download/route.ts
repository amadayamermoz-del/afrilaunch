import { forwardAuthenticatedDownload } from "@/lib/backend-proxy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardAuthenticatedDownload(
    `/documents/${encodeURIComponent(id)}/download`,
  );
}
