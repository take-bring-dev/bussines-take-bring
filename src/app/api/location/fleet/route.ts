import { NextResponse } from "next/server";

/** Live fleet locations temporarily disabled. */
export async function GET() {
  return NextResponse.json(
    { error: "Location tracking is temporarily disabled.", locations: [] },
    { status: 503 },
  );
}
