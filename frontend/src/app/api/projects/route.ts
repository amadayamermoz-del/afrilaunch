import { forwardAuthenticatedRequest } from "@/lib/backend-proxy";

export function GET(request: Request) {
  return forwardAuthenticatedRequest("/projects", request, "GET");
}

export function POST(request: Request) {
  return forwardAuthenticatedRequest("/projects", request, "POST");
}
