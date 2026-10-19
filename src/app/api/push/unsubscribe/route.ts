import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : null;

  if (token) {
    await prisma.deviceToken.updateMany({
      where: { userId: auth.user.id, token },
      data: { isActive: false },
    });
  } else {
    await prisma.deviceToken.updateMany({
      where: { userId: auth.user.id },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ ok: true });
}
