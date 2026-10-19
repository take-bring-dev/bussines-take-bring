import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REFRESH_COOKIE } from "@/lib/auth/constants";
import { clearAuthCookies, revokeRefreshToken } from "@/lib/auth/session";

export async function POST() {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  await revokeRefreshToken(refresh);
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
