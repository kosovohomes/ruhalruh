import { describe, expect, it } from "vitest";
import { redactSensitive } from "./logger";

describe("redactSensitive", () => {
  it("redacts sensitive keys at any depth", () => {
    const result = redactSensitive({
      safe: "keep me",
      nested: {
        password: "secret",
        items: [{ apiKey: "secret", value: "keep me too" }],
      },
    }) as { safe: string; nested: { password: string; items: Array<Record<string, string>> } };

    expect(result.safe).toBe("keep me");
    expect(result.nested.password).toBe("[REDACTED]");
    expect(result.nested.items[0].apiKey).toBe("[REDACTED]");
    expect(result.nested.items[0].value).toBe("keep me too");
  });

  it("does not loop forever on circular data", () => {
    const value: Record<string, unknown> = { token: "secret" };
    value.self = value;

    const result = redactSensitive(value) as Record<string, unknown>;

    expect(result.token).toBe("[REDACTED]");
    expect(result.self).toBe("[CIRCULAR]");
  });
});
