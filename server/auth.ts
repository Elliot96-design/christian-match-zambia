import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "development-only-change-me");

export type AuthTokenPayload = { userId: number };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createAuthToken(userId: number) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "30d")
    .sign(secret);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.userId ?? payload.sub);
    return Number.isInteger(userId) && userId > 0 ? { userId } : null;
  } catch {
    return null;
  }
}

export function getBearerToken(header?: string) {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export function createOneTimeToken() {
  return randomBytes(32).toString("hex");
}

export function hashOneTimeToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
