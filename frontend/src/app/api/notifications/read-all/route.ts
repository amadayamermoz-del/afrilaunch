import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

export function PATCH(request: Request) {
  return forwardAuthenticatedRequest("/notifications/read-all", request, "PATCH");
}
