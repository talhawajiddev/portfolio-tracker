const store = new Map<string, { expiry: number; value: unknown }>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiry > Date.now()) {
    return hit.value as T;
  }
  const value = await loader();
  store.set(key, { expiry: Date.now() + ttlMs, value });
  return value;
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
