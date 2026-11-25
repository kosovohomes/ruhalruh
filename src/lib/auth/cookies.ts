import type { NextResponse } from "next/server";
import type { AuthConfig } from "./config";

export const ACCESS_COOKIE = "rrah_access";
export const REFRESH_COOKIE = "rrah_refresh";

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName !== name) continue;
    try {
      return decodeURIComponent(rest.join("="));
    } catch {
      return rest.join("=");
    }
  }

  return undefined;
}

function cookieOptions(config: AuthConfig, maxAge: number) {
  return {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function setSessionCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
  config: AuthConfig,
): void {
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: tokens.accessToken,
    ...cookieOptions(config, config.accessTtlSeconds),
  });
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: tokens.refreshToken,
    ...cookieOptions(config, config.refreshTtlSeconds),
  });
}

export function clearSessionCookies(response: NextResponse, config: AuthConfig): void {
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: "",
    ...cookieOptions(config, 0),
  });
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: "",
    ...cookieOptions(config, 0),
  });
}

/** State-changing routes accept only same-origin browser requests. */
export function requireSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const host = request.headers.get("x-forwarded-host") ?? new URL(request.url).host;
  const protocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.slice(0, -1);

  try {
    const parsed = new URL(origin);
    return parsed.host === host && parsed.protocol === `${protocol}:`;
  } catch {
    return false;
  }
}
