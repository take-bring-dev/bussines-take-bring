import { NextResponse } from "next/server";
import {
  ingestCorsHeaders,
  ingestWithToken,
  parseIngestPayload,
} from "@/lib/location-ingest";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: ingestCorsHeaders(),
  });
}

async function handle(request: Request) {
  const url = new URL(request.url);
  let body: Record<string, unknown> | null = null;
  if (request.method === "POST") {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      body = (await request.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;
    } else if (
      ct.includes("application/x-www-form-urlencoded") ||
      ct.includes("multipart/form-data")
    ) {
      const form = await request.formData().catch(() => null);
      if (form) {
        body = Object.fromEntries(
          [...form.entries()].map(([k, v]) => [k, String(v)]),
        );
      }
    }
  }

  const parsed = parseIngestPayload(url.searchParams, body);
  if ("error" in parsed) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400, headers: ingestCorsHeaders() },
    );
  }

  const result = await ingestWithToken(parsed);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status, headers: ingestCorsHeaders() },
    );
  }

  // Traccar Client expects a simple 200
  return NextResponse.json(
    { ok: true, driverId: result.driverId },
    { headers: ingestCorsHeaders() },
  );
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
