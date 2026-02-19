const store = new Map<string, number[]>();

// Cleanup expired entries every 60 seconds
const CLEANUP_INTERVAL_MS = 60_000;
const MAX_WINDOW_MS = 5 * 60 * 1000; // 5 minutes (longest window we use)

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - MAX_WINDOW_MS;
    for (const [key, timestamps] of store) {
      const filtered = timestamps.filter((t) => t > cutoff);
      if (filtered.length === 0) {
        store.delete(key);
      } else {
        store.set(key, filtered);
      }
    }
  }, CLEANUP_INTERVAL_MS).unref?.();
}

export function checkRateLimit(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number }
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (store.get(key) || []).filter((t) => t > windowStart);

  if (timestamps.length >= maxRequests) {
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return { allowed: true };
}

export const CHAT_BURST = { maxRequests: 2, windowMs: 1_000 };
export const CHAT_SUSTAINED = { maxRequests: 30, windowMs: 5 * 60 * 1_000 };
