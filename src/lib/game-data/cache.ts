/**
 * Process-local TTL cache for game-data provider responses.
 * Survives across requests in a warm Node process; resets on cold start / deploy.
 */

type Entry = { value: unknown; expires: number }
const store = new Map<string, Entry>()

export async function withGameDataCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const hit = store.get(key)
    if (hit && hit.expires > now) {
        return hit.value as T
    }
    const value = await fn()
    store.set(key, { value, expires: now + ttlMs })
    return value
}

export function clearGameDataCache(): void {
    store.clear()
}
