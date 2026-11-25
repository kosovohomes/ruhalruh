import { createHash, randomBytes } from "node:crypto";
import { getEnv } from "../env";

export interface AuthConfig {
  secret: string;
  secureCookies: boolean;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
}

let developmentSecret: string | undefined;

export function getAuthConfig(): AuthConfig {
  const env = getEnv();
  const secret =
    env.AUTH_SECRET ||
    (env.NODE_ENV === "production"
      ? undefined
      : (developmentSecret ??= randomBytes(32).toString("base64url")));

  if (!secret) {
    throw new Error("A token signing secret is required");
  }

  return {
    secret,
    secureCookies: env.NODE_ENV === "production",
    accessTtlSeconds: 15 * 60,
    refreshTtlSeconds: 30 * 24 * 60 * 60,
  };
}

export function newOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
