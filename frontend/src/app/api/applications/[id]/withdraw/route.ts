import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return forwardAuthenticatedRequest(
    `/applications/${encodeURIComponent(id)}/withdraw`,
    request,
    "POST",
  );
}
