import { createHmac, timingSafeEqual } from "node:crypto";
import { APP_ROLES, type AppRole } from "./types";

const ISSUER = "ruh-al-ruh";
const HEADER = { alg: "HS256", typ: "JWT" } as const;

export interface AccessTokenClaims {
  iss: string;
  sub: string;
  role: "authenticated";
  app_role: AppRole;
  email: string;
  iat: number;
  exp: number;
}

type SignableUser = Pick<import("./types").UserRecord, "id" | "email" | "role">;

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function sign(input: string, secret: string): string {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function signAccessToken(
  user: SignableUser,
  secret: string,
  ttlSeconds: number,
): string {
  const now = Math.floor(Date.now() / 1000);
  const claims: AccessTokenClaims = {
    iss: ISSUER,
    sub: user.id,
    role: "authenticated",
    app_role: user.role,
    email: user.email,
    iat: now,
    exp: now + ttlSeconds,
  };

  const encodedHeader = encode(HEADER);
  const encodedPayload = encode(claims);
  const input = `${encodedHeader}.${encodedPayload}`;
  return `${input}.${sign(input, secret)}`;
}

export function verifyAccessToken(token: string, secret: string): AccessTokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const header = decode<{ alg?: string; typ?: string }>(parts[0]);
  if (header?.alg !== "HS256" || header.typ !== "JWT") return null;

  const input = `${parts[0]}.${parts[1]}`;
  if (!safeEqual(parts[2], sign(input, secret))) return null;

  const claims = decode<AccessTokenClaims>(parts[1]);
  if (!claims) return null;
  if (claims.iss !== ISSUER) return null;
  if (claims.role !== "authenticated") return null;
  if (typeof claims.sub !== "string" || claims.sub.length === 0) return null;
  if (!APP_ROLES.includes(claims.app_role)) return null;
  if (typeof claims.exp !== "number" || claims.exp <= Date.now() / 1000) return null;

  return claims;
}
