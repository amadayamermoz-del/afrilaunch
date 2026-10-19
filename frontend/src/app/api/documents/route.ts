import {
  forwardAuthenticatedFormRequest,
  forwardAuthenticatedRequest,
} from "@/lib/backend-proxy";

export function GET(request: Request) {
  return forwardAuthenticatedRequest("/documents", request, "GET");
}

export function POST(request: Request) {
  return forwardAuthenticatedFormRequest("/documents", request);
}
