import { clearSessionCookies, readCookie, REFRESH_COOKIE, setSessionCookies } from "@/lib/auth/cookies";
import { getAuthConfig } from "@/lib/auth/config";
import { enforceRateLimit, jsonError, jsonOk, rejectCrossOrigin } from "@/lib/auth/http";
import { rotateSession } from "@/lib/auth/session";
import { toSafeUser } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = enforceRateLimit(request, "refresh", 30, WINDOW_MS);
  if (limited) return limited;

  const config = getAuthConfig();
  const session = await rotateSession(readCookie(request, REFRESH_COOKIE));

  if (!session) {
    const response = jsonError(401, "INVALID_REFRESH_TOKEN", "The session has ended. Please sign in again.");
    clearSessionCookies(response, config);
    return response;
  }

  const response = jsonOk({ user: toSafeUser(session.user) });
  setSessionCookies(response, session, config);
  return response;
}
