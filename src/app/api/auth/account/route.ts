import { clearSessionCookies } from "@/lib/auth/cookies";
import { getAuthConfig } from "@/lib/auth/config";
import { enforceRateLimit, jsonError, jsonOk, parseBody, rejectCrossOrigin } from "@/lib/auth/http";
import { verifyPassword } from "@/lib/auth/password";
import { deleteAccountSchema } from "@/lib/auth/schemas";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getUserStore } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 60 * 1000;

export async function DELETE(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = enforceRateLimit(request, "account_delete", 3, WINDOW_MS);
  if (limited) return limited;

  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, "UNAUTHENTICATED", "You are not signed in.");
  }

  const parsed = await parseBody(request, deleteAccountSchema);
  if (!parsed.ok) return parsed.response;

  const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordMatches) {
    return jsonError(401, "INVALID_PASSWORD", "Password is incorrect.");
  }

  await getUserStore().deleteUser(user.id);

  const response = jsonOk({ ok: true });
  clearSessionCookies(response, getAuthConfig());
  return response;
}
