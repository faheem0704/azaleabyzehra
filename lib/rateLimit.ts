// In-memory rate limiter — resets on server restart (fine for single-instance dev/staging).
// TODO: replace with Redis/Upstash KV for multi-instance production deploys.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const MAX_STORE_SIZE = 10_000;

function cleanupExpired(): void {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key);
  });
}

// Periodic cleanup every 5 minutes as a backstop
setInterval(cleanupExpired, 5 * 60 * 1000);

/**
 * Check and increment rate limit.
 * @returns true if the request is allowed, false if rate-limited
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();

  // Memory guard: prune expired entries if store is getting large
  if (store.size >= MAX_STORE_SIZE) {
    cleanupExpired();
  }

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count += 1;
  return true;
}
