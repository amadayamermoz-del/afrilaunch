import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

export function POST(request: Request) {
  return forwardAuthenticatedRequest("/auth/change-password", request, "POST");
}
