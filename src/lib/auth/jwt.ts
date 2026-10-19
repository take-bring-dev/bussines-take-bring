import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";
import { ACCESS_MAX_AGE, REFRESH_MAX_AGE } from "./constants";

export type TokenPayload = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
};

function getSecret() {
  const secret = process.env.PLATFORM_JWT_SECRET?.trim();
  if (!secret || secret.length < 24) {
    throw new Error("PLATFORM_JWT_SECRET must be set (min 24 chars).");
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(user: TokenPayload) {
  return new SignJWT({
    email: user.email,
    role: user.role,
    name: user.name,
    typ: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_MAX_AGE}s`)
    .sign(getSecret());
}

export async function signRefreshToken(user: TokenPayload, jti: string) {
  return new SignJWT({
    email: user.email,
    role: user.role,
    name: user.name,
    typ: "refresh",
    jti,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyAccessToken(token: string | undefined) {
  return verifyToken(token, "access");
}

export async function verifyRefreshToken(token: string | undefined) {
  return verifyToken(token, "refresh");
}

async function verifyToken(
  token: string | undefined,
  typ: "access" | "refresh",
): Promise<(TokenPayload & { jti?: string }) | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.typ !== typ) return null;
    const id = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const role = typeof payload.role === "string" ? (payload.role as UserRole) : null;
    const name = typeof payload.name === "string" ? payload.name : "";
    if (!id || !email || !role) return null;
    return {
      id,
      email,
      role,
      name,
      jti: typeof payload.jti === "string" ? payload.jti : undefined,
    };
  } catch {
    return null;
  }
}
