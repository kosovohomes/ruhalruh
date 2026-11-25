import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the correct password", async () => {
    const hash = await hashPassword("a-long-passphrase");
    await expect(verifyPassword("a-long-passphrase", hash)).resolves.toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("a-long-passphrase");
    await expect(verifyPassword("another-long-passphrase", hash)).resolves.toBe(false);
  });

  it("uses a fresh salt for every hash", async () => {
    const first = await hashPassword("same-password-value");
    const second = await hashPassword("same-password-value");
    expect(first).not.toBe(second);
  });

  it("rejects malformed stored hashes", async () => {
    await expect(verifyPassword("anything", "not-a-real-hash")).resolves.toBe(false);
  });
});
