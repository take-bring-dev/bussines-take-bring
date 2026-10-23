import { NextResponse } from "next/server";

/** Per-user location temporarily disabled. */
export async function GET() {
  return NextResponse.json(
    { error: "Location tracking is temporarily disabled." },
    { status: 503 },
  );
}
