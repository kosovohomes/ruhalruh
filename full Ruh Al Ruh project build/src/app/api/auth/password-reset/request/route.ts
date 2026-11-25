import { getAuthConfig, hashToken, newOpaqueToken } from "@/lib/auth/config";
import { enforceRateLimit, jsonError, jsonOk, parseBody, rejectCrossOrigin } from "@/lib/auth/http";
import { passwordResetRequestSchema } from "@/lib/auth/schemas";
import { getUserStore } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const config = getAuthConfig();
  if (config.secureCookies) {
    return jsonError(
      501,
      "EMAIL_DELIVERY_NOT_CONFIGURED",
      "Password reset delivery is not configured yet.",
    );
  }

  const limited = enforceRateLimit(request, "password_reset_request", 3, WINDOW_MS);
  if (limited) return limited;

  const parsed = await parseBody(request, passwordResetRequestSchema);
  if (!parsed.ok) return parsed.response;

  const user = await getUserStore().findByEmail(parsed.data.email).catch(() => null);
  if (!user) {
    // Same response whether or not the address exists.
    return jsonOk({ ok: true });
  }

  const token = newOpaqueToken();
  await getUserStore().createPasswordReset({
    tokenHash: hashToken(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  // Local development has no email provider. The token is returned only here
  // so the reset flow can be completed and tested; it is never returned in production.
  return jsonOk({ ok: true, devResetToken: token });
}
