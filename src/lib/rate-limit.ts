export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

interface BucketEntry {
  timestamps: number[];
  lastSeen: number;
}

// Persist across hot-reloads in dev and warm serverless invocations in production
const globalForRateLimit = globalThis as unknown as {
  __scopebotRateLimitStore?: Map<string, BucketEntry>;
};

const store: Map<string, BucketEntry> =
  globalForRateLimit.__scopebotRateLimitStore ?? new Map<string, BucketEntry>();

if (!globalForRateLimit.__scopebotRateLimitStore) {
  globalForRateLimit.__scopebotRateLimitStore = store;
}

const MAX_STORE_KEYS = 2000;

function cleanupExpired(now: number, windowMs: number) {
  if (store.size <= MAX_STORE_KEYS) return;
  for (const [key, entry] of store.entries()) {
    if (now - entry.lastSeen > windowMs) {
      store.delete(key);
    }
  }
}

export function getClientIp(headers: Headers): string {
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0];
    if (first) return first.trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const maxRequests = Math.max(
    1,
    Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10", 10) || 10
  );
  const windowMs = Math.max(
    1000,
    Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10) || 60000
  );

  const now = Date.now();
  cleanupExpired(now, windowMs);

  const existing = store.get(identifier) ?? { timestamps: [], lastSeen: now };
  const windowStart = now - windowMs;

  // Keep only timestamps within the active sliding window
  const recentTimestamps = existing.timestamps.filter((ts) => ts > windowStart);

  if (recentTimestamps.length >= maxRequests) {
    const oldestInWindow = recentTimestamps[0] ?? now;
    const resetAt = oldestInWindow + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

    store.set(identifier, {
      timestamps: recentTimestamps,
      lastSeen: now,
    });

    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetAt,
      retryAfterSeconds,
    };
  }

  recentTimestamps.push(now);
  store.set(identifier, {
    timestamps: recentTimestamps,
    lastSeen: now,
  });

  const oldestInWindow = recentTimestamps[0] ?? now;
  const resetAt = oldestInWindow + windowMs;

  return {
    allowed: true,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - recentTimestamps.length),
    resetAt,
    retryAfterSeconds: 0,
  };
}

export function buildRateLimitHeaders(rate: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(rate.limit),
    "X-RateLimit-Remaining": String(rate.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rate.resetAt / 1000)),
  };
  if (!rate.allowed) {
    headers["Retry-After"] = String(rate.retryAfterSeconds);
  }
  return headers;
}
