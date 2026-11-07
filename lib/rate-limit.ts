type RateLimitEntry = { count: number; resetAt: number };

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
};

type RateLimiterOptions = {
  interval: number;
  maxRequests: number;
};

export function createRateLimiter(opts: RateLimiterOptions) {
  const map = new Map<string, RateLimitEntry>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of map) {
      if (entry.resetAt <= now) map.delete(key);
    }
  }, 5 * 60 * 1000).unref();

  function check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = map.get(key);

    if (!entry || entry.resetAt <= now) {
      map.set(key, { count: 1, resetAt: now + opts.interval });
      return { allowed: true, remaining: opts.maxRequests - 1 };
    }

    if (entry.count >= opts.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    entry.count++;
    return { allowed: true, remaining: opts.maxRequests - entry.count };
  }

  return { check };
}
