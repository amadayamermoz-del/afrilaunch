import { authenticate } from "@/lib/auth-proxy";

export function POST(request: Request) {
  return authenticate("register", request);
}
