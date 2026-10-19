import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const platform =
    typeof body.platform === "string" ? body.platform.slice(0, 64) : null;
  const deviceType =
    typeof body.deviceType === "string" ? body.deviceType.slice(0, 64) : null;
  const userAgent =
    typeof body.userAgent === "string"
      ? body.userAgent.slice(0, 500)
      : request.headers.get("user-agent")?.slice(0, 500) || null;

  const existing = await prisma.deviceToken.findUnique({ where: { token } });

  if (existing) {
    const updated = await prisma.deviceToken.update({
      where: { token },
      data: {
        userId: auth.user.id,
        platform,
        deviceType,
        userAgent,
        isActive: true,
        lastSeen: new Date(),
      },
    });
    return NextResponse.json({ ok: true, id: updated.id, reused: true });
  }

  const created = await prisma.deviceToken.create({
    data: {
      userId: auth.user.id,
      token,
      platform,
      deviceType,
      userAgent,
      isActive: true,
    },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
