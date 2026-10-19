import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, roleHome, setAuthCookies } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const tokens = await createSession(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name || user.email,
      },
      { userAgent: request.headers.get("user-agent") || undefined },
    );

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "auth.login",
        entityType: "user",
        entityId: user.id,
      },
    });

    const response = NextResponse.json({
      ok: true,
      redirectTo: roleHome(user.role),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    console.error("login error", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
