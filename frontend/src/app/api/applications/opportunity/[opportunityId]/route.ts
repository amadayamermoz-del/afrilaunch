import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> },
) {
  const { opportunityId } = await params;
  return forwardAuthenticatedRequest(
    `/applications/opportunity/${encodeURIComponent(opportunityId)}`,
    request,
    "POST",
  );
}
