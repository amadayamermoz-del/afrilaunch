import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

export function GET(request: Request) {
  return forwardAuthenticatedRequest("/profile", request, "GET");
}

export function PATCH(request: Request) {
  return forwardAuthenticatedRequest("/profile", request, "PATCH");
}
