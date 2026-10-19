import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";

const PROTECTED = ["/s", "/c", "/admin", "/activation"];

function getSecret() {
  const secret = process.env.PLATFORM_JWT_SECRET?.trim();
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function hasValidToken(request: NextRequest) {
  const secret = getSecret();
  if (!secret) return false;
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  for (const token of [access, refresh]) {
    if (!token) continue;
    try {
      await jwtVerify(token, secret);
      return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!needsAuth) return NextResponse.next();

  if (await hasValidToken(request)) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/s/:path*", "/c/:path*", "/admin/:path*", "/activation", "/activation/:path*"],
};
