import { getAuthConfig } from "@/lib/auth/config";
import { EmailAlreadyExistsError } from "@/lib/auth/errors";
import { enforceRateLimit, jsonError, jsonOk, parseBody, rejectCrossOrigin } from "@/lib/auth/http";
import { setSessionCookies } from "@/lib/auth/cookies";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/auth/schemas";
import { issueSession } from "@/lib/auth/session";
import { getUserStore } from "@/lib/auth/store";
import { toSafeUser } from "@/lib/auth/types";
import { createLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const logger = createLogger("auth.register");
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = enforceRateLimit(request, "register", 5, WINDOW_MS);
  if (limited) return limited;

  const parsed = await parseBody(request, registerSchema);
  if (!parsed.ok) return parsed.response;

  const { email, password, name, preferredLanguage, culturalContext } = parsed.data;
  const store = getUserStore();

  try {
    const existing = await store.findByEmail(email);
    if (existing) {
      return jsonError(409, "EMAIL_IN_USE", "That email address is already registered.");
    }

    const passwordHash = await hashPassword(password);
    const user = await store.createUser({
      email,
      passwordHash,
      name,
      role: "individual",
      preferredLanguage,
      culturalContext: culturalContext ?? null,
    });
    const session = await issueSession(user);

    const response = jsonOk({ user: toSafeUser(user) }, 201);
    setSessionCookies(response, session, getAuthConfig());
    return response;
  } catch (error) {
    if (error instanceof EmailAlreadyExistsError) {
      return jsonError(409, "EMAIL_IN_USE", "That email address is already registered.");
    }
    logger.error("registration failed", { name: error instanceof Error ? error.name : "Unknown" });
    return jsonError(500, "REGISTRATION_FAILED", "Registration could not be completed.");
  }
}
