import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

function hrefFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const href = (payload as Record<string, unknown>).href;
  return typeof href === "string" && href.length ? href : null;
}

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({
      where: { userId: auth.user.id, readAt: null },
    }),
  ]);

  return NextResponse.json({
    unreadCount,
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      readAt: n.readAt,
      createdAt: n.createdAt,
      href: hrefFromPayload(n.payload),
    })),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  const body = await request.json();
  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true, unreadCount: 0 });
  }

  if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: auth.user.id },
      data: { readAt: new Date() },
    });
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: auth.user.id, readAt: null },
  });

  return NextResponse.json({ ok: true, unreadCount });
}
