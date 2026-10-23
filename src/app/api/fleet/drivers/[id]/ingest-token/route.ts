import { NextResponse } from "next/server";

/** GPS device link temporarily disabled with location tracking. */
export async function GET() {
  return NextResponse.json(
    { error: "Location tracking is temporarily disabled." },
    { status: 503 },
  );
}

export async function POST() {
  return GET();
}
