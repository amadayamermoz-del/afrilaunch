import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getCurrentUser } from "@/lib/auth-proxy";

export async function GET() {
  const cookieStore = await cookies();
  return getCurrentUser(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}
