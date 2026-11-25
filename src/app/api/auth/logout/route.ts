import { clearSessionCookies, readCookie, REFRESH_COOKIE } from "@/lib/auth/cookies";
import { getAuthConfig } from "@/lib/auth/config";
import { jsonOk, rejectCrossOrigin } from "@/lib/auth/http";
import { revokeSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  await revokeSession(readCookie(request, REFRESH_COOKIE));

  const response = jsonOk({ ok: true });
  clearSessionCookies(response, getAuthConfig());
  return response;
}
