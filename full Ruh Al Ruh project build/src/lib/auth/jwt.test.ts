import { describe, expect, it } from "vitest";
import { signAccessToken, verifyAccessToken } from "./jwt";

const secret = "a-test-secret-with-more-than-thirty-two-characters";
const user = { id: "member-1", email: "member@example.com", role: "individual" as const };

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

describe("access tokens", () => {
  it("signs and verifies member claims", () => {
    const token = signAccessToken(user, secret, 900);
    const claims = verifyAccessToken(token, secret);

    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe(user.id);
    expect(claims?.role).toBe("authenticated");
    expect(claims?.app_role).toBe("individual");
  });

  it("rejects a token signed with another secret", () => {
    const token = signAccessToken(user, secret, 900);
    expect(verifyAccessToken(token, `${secret}-different`)).toBeNull();
  });

  it("rejects a tampered token", () => {
    const token = signAccessToken(user, secret, 900);
    const tampered = `${token.slice(0, -2)}zz`;
    expect(verifyAccessToken(tampered, secret)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = signAccessToken(user, secret, -10);
    expect(verifyAccessToken(token, secret)).toBeNull();
  });

  it("rejects an unsigned token", () => {
    const header = encode({ alg: "none", typ: "JWT" });
    const payload = encode({
      iss: "ruh-al-ruh",
      sub: user.id,
      role: "authenticated",
      app_role: "individual",
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    expect(verifyAccessToken(`${header}.${payload}.`, secret)).toBeNull();
  });
});
