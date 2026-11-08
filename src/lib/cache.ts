/**
 * Tiny in-memory TTL cache with in-flight de-duplication.
 * Keeps React StrictMode's double effects and quick back/forward navigation
 * from hitting the (rate-limited) API again.
 */
const store = new Map<string, { expires: number; value: Promise<unknown> }>();

export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
  const value = load().catch((err) => {
    store.delete(key); // never cache failures
    throw err;
  });
  store.set(key, { expires: Date.now() + ttlMs, value });
  return value;
}

export function invalidate(prefix: string) {
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
}
