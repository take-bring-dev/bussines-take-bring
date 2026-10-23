import { NextResponse } from "next/server";

/** Traccar / GPS Logger ingest temporarily disabled. */
export async function GET() {
  return NextResponse.json(
    { error: "Location tracking is temporarily disabled." },
    { status: 503 },
  );
}

export async function POST() {
  return GET();
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
