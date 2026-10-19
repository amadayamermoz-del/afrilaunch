import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-proxy";

export function POST() {
  const response = NextResponse.json({ loggedOut: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
