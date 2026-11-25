import { describe, expect, it } from "vitest";
import { EmailAlreadyExistsError } from "./errors";
import { InMemoryUserStore } from "./store";

async function createUser(store: InMemoryUserStore, email = "member@example.com") {
  return store.createUser({
    email,
    passwordHash: "stored-hash",
    name: "Test Member",
    role: "individual",
    preferredLanguage: "en",
    culturalContext: null,
  });
}

describe("InMemoryUserStore", () => {
  it("normalises email addresses and prevents duplicates", async () => {
    const store = new InMemoryUserStore();
    await createUser(store, "Member@Example.com");

    await expect(store.findByEmail("member@example.com")).resolves.toMatchObject({
      email: "member@example.com",
    });
    await expect(createUser(store, "MEMBER@example.com")).rejects.toThrow(EmailAlreadyExistsError);
  });

  it("rotates and revokes refresh tokens", async () => {
    const store = new InMemoryUserStore();
    const user = await createUser(store);

    const token = await store.createRefreshToken({
      tokenHash: "hash-1",
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await expect(store.findRefreshToken("hash-1")).resolves.toMatchObject({ id: token.id });

    await store.revokeRefreshToken(token.id);
    await expect(store.findRefreshToken("hash-1")).resolves.toMatchObject({
      revokedAt: expect.any(Date),
    });
  });

  it("uses a password reset only once", async () => {
    const store = new InMemoryUserStore();
    const user = await createUser(store);

    const reset = await store.createPasswordReset({
      tokenHash: "reset-hash",
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await store.markPasswordResetUsed(reset.id);

    await expect(store.findPasswordReset("reset-hash")).resolves.toMatchObject({
      usedAt: expect.any(Date),
    });
  });

  it("removes tokens and resets when a user is deleted", async () => {
    const store = new InMemoryUserStore();
    const user = await createUser(store);

    await store.createRefreshToken({
      tokenHash: "hash-1",
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await store.createPasswordReset({
      tokenHash: "reset-hash",
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await store.deleteUser(user.id);

    await expect(store.findById(user.id)).resolves.toBeNull();
    await expect(store.findRefreshToken("hash-1")).resolves.toBeNull();
    await expect(store.findPasswordReset("reset-hash")).resolves.toBeNull();
  });
});
