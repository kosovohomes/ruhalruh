import { describe, expect, it } from "vitest";
import { RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  it("allows attempts up to the limit, then blocks until the window resets", () => {
    let now = 1_000;
    const limiter = new RateLimiter(2, 1_000, () => now);

    expect(limiter.check("login:ip")).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.check("login:ip")).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.check("login:ip")).toMatchObject({ allowed: false, remaining: 0, retryAfterSeconds: 1 });

    now = 2_001;
    expect(limiter.check("login:ip")).toMatchObject({ allowed: true, remaining: 1 });
  });

  it("tracks separate keys independently", () => {
    const limiter = new RateLimiter(1, 1_000, () => 0);

    expect(limiter.check("login:a").allowed).toBe(true);
    expect(limiter.check("login:a").allowed).toBe(false);
    expect(limiter.check("login:b").allowed).toBe(true);
  });
});
