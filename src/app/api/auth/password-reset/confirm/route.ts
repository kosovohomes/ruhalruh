import { clearSessionCookies } from "@/lib/auth/cookies";
import { getAuthConfig, hashToken } from "@/lib/auth/config";
import { enforceRateLimit, jsonError, jsonOk, parseBody, rejectCrossOrigin } from "@/lib/auth/http";
import { hashPassword } from "@/lib/auth/password";
import { passwordResetConfirmSchema } from "@/lib/auth/schemas";
import { getUserStore } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = enforceRateLimit(request, "password_reset_confirm", 5, WINDOW_MS);
  if (limited) return limited;

  const parsed = await parseBody(request, passwordResetConfirmSchema);
  if (!parsed.ok) return parsed.response;

  const store = getUserStore();
  const reset = await store.findPasswordReset(hashToken(parsed.data.token)).catch(() => null);
  const invalidToken = () =>
    jsonError(400, "INVALID_RESET_TOKEN", "This reset link is invalid or has expired.");

  if (!reset || reset.usedAt || reset.expiresAt.getTime() <= Date.now()) {
    return invalidToken();
  }

  const user = await store.findById(reset.userId);
  if (!user) return invalidToken();

  const passwordHash = await hashPassword(parsed.data.password);
  await store.updatePasswordHash(user.id, passwordHash);
  await store.markPasswordResetUsed(reset.id);
  await store.revokeAllRefreshTokens(user.id);
  await store.revokeAllPasswordResets(user.id);

  const response = jsonOk({ ok: true });
  clearSessionCookies(response, getAuthConfig());
  return response;
}
