import { NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://127.0.0.1:4000/api";

export async function GET() {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_API_URL}/categories`, {
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "The backend API is unavailable" },
      { status: 503 },
    );
  }

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}
