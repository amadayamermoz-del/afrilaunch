import { NextResponse } from "next/server";

export const AUTH_COOKIE_NAME = "afrilauch_access_token";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://127.0.0.1:4000/api";

type AuthEndpoint = "login" | "register";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function authenticate(
  endpoint: AuthEndpoint,
  request: Request,
): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON request body" }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const credentials =
    endpoint === "register"
      ? { name: body.name, email: body.email, password: body.password }
      : { email: body.email, password: body.password };
  if (
    Object.values(credentials).some((value) => typeof value !== "string")
  ) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_API_URL}/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "The authentication service is unavailable" },
      { status: 503 },
    );
  }

  const result: unknown = await readJson(upstream);
  if (!upstream.ok) {
    return NextResponse.json(result ?? { message: "Authentication failed" }, {
      status: upstream.status,
    });
  }

  if (
    !isRecord(result) ||
    typeof result.accessToken !== "string" ||
    typeof result.expiresIn !== "number" ||
    !isRecord(result.user)
  ) {
    return NextResponse.json(
      { message: "The authentication service returned an invalid response" },
      { status: 502 },
    );
  }

  const user = result.user;
  if (
    typeof user.id !== "string" ||
    typeof user.name !== "string" ||
    typeof user.email !== "string" ||
    (user.role !== "USER" && user.role !== "ADMIN") ||
    (user.status !== "ACTIVE" && user.status !== "SUSPENDED")
  ) {
    return NextResponse.json(
      { message: "The authentication service returned an invalid user" },
      { status: 502 },
    );
  }

  const response = NextResponse.json({
    user,
    expiresIn: result.expiresIn,
  });
  response.cookies.set(AUTH_COOKIE_NAME, result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: result.expiresIn,
  });
  return response;
}

export async function getCurrentUser(token: string | undefined) {
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "The authentication service is unavailable" },
      { status: 503 },
    );
  }

  const result: unknown = await readJson(upstream);
  if (!upstream.ok) {
    const response = NextResponse.json(result ?? { message: "Authentication failed" }, {
      status: upstream.status,
    });
    if (upstream.status === 401) {
      response.cookies.delete(AUTH_COOKIE_NAME);
    }
    return response;
  }

  if (
    !isRecord(result) ||
    typeof result.id !== "string" ||
    typeof result.name !== "string" ||
    typeof result.email !== "string" ||
    (result.role !== "USER" && result.role !== "ADMIN") ||
    (result.status !== "ACTIVE" && result.status !== "SUSPENDED")
  ) {
    return NextResponse.json(
      { message: "The authentication service returned an invalid user" },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
