export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = () => Date.now(),
  ) {}

  check(key: string): RateLimitResult {
    const now = this.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.limit - 1, retryAfterSeconds: 0 };
    }

    if (bucket.count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
      };
    }

    bucket.count += 1;
    return { allowed: true, remaining: this.limit - bucket.count, retryAfterSeconds: 0 };
  }
}

type GlobalWithRateLimiters = typeof globalThis & {
  __ruhAlRuhRateLimiters?: Map<string, RateLimiter>;
};

const globalForRateLimiters = globalThis as GlobalWithRateLimiters;

export function getRateLimiter(action: string, limit: number, windowMs: number): RateLimiter {
  const key = `${action}:${limit}:${windowMs}`;
  const registry = (globalForRateLimiters.__ruhAlRuhRateLimiters ??= new Map());
  let limiter = registry.get(key);
  if (!limiter) {
    limiter = new RateLimiter(limit, windowMs);
    registry.set(key, limiter);
  }
  return limiter;
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return forwarded || real || "local";
}

export function checkRateLimit(
  request: Request,
  action: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  return getRateLimiter(action, limit, windowMs).check(`${action}:${clientKey(request)}`);
}
