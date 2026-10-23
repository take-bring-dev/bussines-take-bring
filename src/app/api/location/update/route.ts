import { NextResponse } from "next/server";

/** Location tracking temporarily disabled. */
export async function POST() {
  return NextResponse.json(
    { error: "Location tracking is temporarily disabled." },
    { status: 503 },
  );
}
