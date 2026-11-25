import { getAuthConfig, hashToken, newOpaqueToken } from "./config";
import { ACCESS_COOKIE, readCookie } from "./cookies";
import { signAccessToken, verifyAccessToken } from "./jwt";
import { getUserStore } from "./store";
import type { AppRole, UserRecord } from "./types";

export interface IssuedSession {
  user: UserRecord;
  accessToken: string;
  refreshToken: string;
}

export async function issueSession(user: UserRecord): Promise<IssuedSession> {
  const config = getAuthConfig();
  const accessToken = signAccessToken(user, config.secret, config.accessTtlSeconds);
  const refreshToken = newOpaqueToken();

  await getUserStore().createRefreshToken({
    tokenHash: hashToken(refreshToken),
    userId: user.id,
    expiresAt: new Date(Date.now() + config.refreshTtlSeconds * 1000),
  });

  return { user, accessToken, refreshToken };
}

export async function rotateSession(refreshToken: string | undefined): Promise<IssuedSession | null> {
  if (!refreshToken) return null;

  const store = getUserStore();
  const existing = await store.findRefreshToken(hashToken(refreshToken));
  if (!existing || existing.revokedAt || existing.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  const user = await store.findById(existing.userId);
  if (!user) return null;

  const next = await issueSession(user);
  await store.revokeRefreshToken(existing.id);
  return next;
}

export async function revokeSession(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;

  const store = getUserStore();
  const record = await store.findRefreshToken(hashToken(refreshToken));
  if (record && !record.revokedAt) {
    await store.revokeRefreshToken(record.id);
  }
}

export async function getAuthenticatedUser(request: Request): Promise<UserRecord | null> {
  const accessToken = readCookie(request, ACCESS_COOKIE);
  if (!accessToken) return null;

  const config = getAuthConfig();
  const claims = verifyAccessToken(accessToken, config.secret);
  if (!claims) return null;

  return getUserStore().findById(claims.sub);
}

export async function requireRole(
  request: Request,
  role: AppRole,
): Promise<UserRecord | null> {
  const user = await getAuthenticatedUser(request);
  if (!user) return null;
  return user.role === role || user.role === "admin" ? user : null;
}
