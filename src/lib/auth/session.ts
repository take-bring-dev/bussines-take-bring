import { createHash, randomUUID } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
} from "./constants";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type TokenPayload,
} from "./jwt";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function roleHome(role: UserRole) {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin";
    case "SHIPPER":
      return "/s";
    case "CARRIER_INDIVIDUAL":
    case "CARRIER_COMPANY_ADMIN":
    case "CARRIER_DRIVER":
      return "/c";
    default:
      return "/login";
  }
}

export async function createSession(
  user: TokenPayload,
  meta?: { userAgent?: string; ip?: string },
) {
  const jti = randomUUID();
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user),
    signRefreshToken(user, jti),
  ]);

  await prisma.authSession.create({
    data: {
      id: jti,
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      userAgent: meta?.userAgent?.slice(0, 500),
      ipAddress: meta?.ip?.slice(0, 64),
      expiresAt: new Date(Date.now() + REFRESH_MAX_AGE * 1000),
    },
  });

  return { accessToken, refreshToken };
}

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
) {
  const base = cookieBase();
  response.cookies.set({
    ...base,
    name: ACCESS_COOKIE,
    value: tokens.accessToken,
    maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set({
    ...base,
    name: REFRESH_COOKIE,
    value: tokens.refreshToken,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(response: NextResponse) {
  const base = cookieBase();
  response.cookies.set({ ...base, name: ACCESS_COOKIE, value: "", maxAge: 0 });
  response.cookies.set({ ...base, name: REFRESH_COOKIE, value: "", maxAge: 0 });
}

export async function getSessionUser() {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const fromAccess = await verifyAccessToken(access);
  if (fromAccess) {
    return {
      id: fromAccess.id,
      email: fromAccess.email,
      name: fromAccess.name || fromAccess.email,
      role: fromAccess.role,
    };
  }

  const refresh = jar.get(REFRESH_COOKIE)?.value;
  const fromRefresh = await verifyRefreshToken(refresh);
  if (!fromRefresh) return null;

  return {
    id: fromRefresh.id,
    email: fromRefresh.email,
    name: fromRefresh.name || fromRefresh.email,
    role: fromRefresh.role,
  };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, status: 401 as const };
  return { ok: true as const, user };
}

export async function requireRoles(...roles: UserRole[]) {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  if (!roles.includes(auth.user.role)) {
    return { ok: false as const, status: 403 as const };
  }
  return auth;
}

export async function revokeRefreshToken(refreshToken: string | undefined) {
  if (!refreshToken) return;
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload?.jti) return;
  await prisma.authSession.updateMany({
    where: { id: payload.jti, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
