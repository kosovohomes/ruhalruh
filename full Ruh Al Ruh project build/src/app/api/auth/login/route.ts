import { setSessionCookies } from "@/lib/auth/cookies";
import { getAuthConfig } from "@/lib/auth/config";
import { enforceRateLimit, jsonError, jsonOk, parseBody, rejectCrossOrigin } from "@/lib/auth/http";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/auth/schemas";
import { issueSession } from "@/lib/auth/session";
import { getUserStore } from "@/lib/auth/store";
import { toSafeUser } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60 * 1000;
let decoyHash: string | undefined;

async function getDecoyHash(): Promise<string> {
  decoyHash ??= await hashPassword("this-is-not-a-real-account");
  return decoyHash;
}

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = enforceRateLimit(request, "login", 5, WINDOW_MS);
  if (limited) return limited;

  const parsed = await parseBody(request, loginSchema);
  if (!parsed.ok) return parsed.response;

  const { email, password } = parsed.data;
  const store = getUserStore();
  const user = await store.findByEmail(email).catch(() => null);
  const validPassword = await verifyPassword(password, user?.passwordHash ?? (await getDecoyHash()));

  if (!user || !validPassword) {
    return jsonError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  await store.updateLastLogin(user.id);
  const currentUser = (await store.findById(user.id)) ?? user;
  const session = await issueSession(currentUser);

  const response = jsonOk({ user: toSafeUser(currentUser) });
  setSessionCookies(response, session, getAuthConfig());
  return response;
}
