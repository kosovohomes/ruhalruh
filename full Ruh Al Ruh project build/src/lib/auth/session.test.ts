import { describe, expect, it } from "vitest";
import { ACCESS_COOKIE, requireSameOrigin } from "./cookies";
import { getAuthenticatedUser, issueSession, rotateSession, revokeSession } from "./session";
import { getUserStore } from "./store";

function requestWithCookies(cookies: Record<string, string>): Request {
  const header = Object.entries(cookies)
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");
  return new Request("http://127.0.0.1:3000/api/auth/me", { headers: { cookie: header } });
}

async function createMember() {
  return getUserStore().createUser({
    email: `member-${crypto.randomUUID()}@example.com`,
    passwordHash: "stored-hash",
    name: "Test Member",
    role: "individual",
    preferredLanguage: "en",
    culturalContext: null,
  });
}

describe("session lifecycle", () => {
  it("authenticates an issued access token", async () => {
    const user = await createMember();
    const session = await issueSession(user);

    const found = await getAuthenticatedUser(
      requestWithCookies({ [ACCESS_COOKIE]: session.accessToken }),
    );

    expect(found?.id).toBe(user.id);
  });

  it("rotates the refresh token and invalidates the old one", async () => {
    const user = await createMember();
    const first = await issueSession(user);

    const second = await rotateSession(first.refreshToken);
    expect(second?.user.id).toBe(user.id);
    expect(second?.refreshToken).not.toBe(first.refreshToken);
    await expect(rotateSession(first.refreshToken)).resolves.toBeNull();

    const found = await getAuthenticatedUser(
      requestWithCookies({ [ACCESS_COOKIE]: second!.accessToken }),
    );
    expect(found?.id).toBe(user.id);
  });

  it("revokes a refresh token on logout", async () => {
    const user = await createMember();
    const session = await issueSession(user);

    await revokeSession(session.refreshToken);
    await expect(rotateSession(session.refreshToken)).resolves.toBeNull();
  });

  it("rejects forged access tokens", async () => {
    const request = requestWithCookies({ [ACCESS_COOKIE]: "not.a.real.token" });
    await expect(getAuthenticatedUser(request)).resolves.toBeNull();
  });
});

describe("same-origin protection", () => {
  it("accepts a matching origin", () => {
    const request = new Request("http://127.0.0.1:3000/api/auth/login", {
      method: "POST",
      headers: { origin: "http://127.0.0.1:3000" },
    });
    expect(requireSameOrigin(request)).toBe(true);
  });

  it("rejects a different or missing origin", () => {
    const crossSite = new Request("http://127.0.0.1:3000/api/auth/login", {
      method: "POST",
      headers: { origin: "https://elsewhere.example" },
    });
    const missing = new Request("http://127.0.0.1:3000/api/auth/login", { method: "POST" });

    expect(requireSameOrigin(crossSite)).toBe(false);
    expect(requireSameOrigin(missing)).toBe(false);
  });
});
