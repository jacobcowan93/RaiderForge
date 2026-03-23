/**
 * ardbService.ts
 *
 * ARDB (ardb.app) API client — secondary game data source.
 * Use ONLY for data not covered by MetaForge (primarily arc-enemies, item detail).
 * Built from ARDB's public API documentation: https://ardb.app/developers/api
 *
 * Attribution (required):
 *   "Data provided by ardb.app"
 *
 * Base URL: https://ardb.app/api
 * Image assets: https://ardb.app/static
 *
 * Schema may change without warning — cache and handle errors defensively.
 */

export const ARDB_BASE = 'https://ardb.app/api'
export const ARDB_STATIC = 'https://ardb.app/static'
export const ARDB_ATTRIBUTION = 'Data provided by ardb.app'

// ── In-memory cache (30 min TTL for all ARDB endpoints) ──────────────────────
type CacheEntry = { data: unknown; expires: number }
const cache = new Map<string, CacheEntry>()
const TTL = 30 * 60 * 1000 // 30 min

async function ardbFetch<T>(path: string): Promise<T> {
  const url = `${ARDB_BASE}${path}`

  const cached = cache.get(url)
  if (cached && Date.now() < cached.expires) {
    return cached.data as T
  }

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 1800 }, // 30 min
  })

  if (!res.ok) {
    throw new Error(`ARDB API error: ${res.status} ${res.statusText} (${url})`)
  }

  const data = (await res.json()) as T
  cache.set(url, { data, expires: Date.now() + TTL })
  return data
}

// ── Type definitions ──────────────────────────────────────────────────────────

export type ArdbItem = {
  id?: string
  name?: string
  description?: string
  image?: string  // relative path — prefix with ARDB_STATIC
  [key: string]: unknown
}

export type ArdbQuest = {
  id?: string
  name?: string
  description?: string
  [key: string]: unknown
}

export type ArdbEnemy = {
  id?: string
  name?: string
  description?: string
  image?: string  // relative path — prefix with ARDB_STATIC
  [key: string]: unknown
}

// ── Public API functions ──────────────────────────────────────────────────────

/** Fetch all items (basic data). Use fetchArdbItem for full detail. */
export async function fetchArdbItems(): Promise<ArdbItem[]> {
  try {
    const data = await ardbFetch<unknown>('/items')
    return Array.isArray(data) ? (data as ArdbItem[]) : []
  } catch (err) {
    console.error('[ARDB] Failed to fetch items:', err)
    return []
  }
}

/** Fetch a single item by ID (full data). */
export async function fetchArdbItem(id: string): Promise<ArdbItem | null> {
  try {
    return await ardbFetch<ArdbItem>(`/items/${encodeURIComponent(id)}`)
  } catch (err) {
    console.error(`[ARDB] Failed to fetch item ${id}:`, err)
    return null
  }
}

/** Fetch all quests (basic data). */
export async function fetchArdbQuests(): Promise<ArdbQuest[]> {
  try {
    const data = await ardbFetch<unknown>('/quests')
    return Array.isArray(data) ? (data as ArdbQuest[]) : []
  } catch (err) {
    console.error('[ARDB] Failed to fetch quests:', err)
    return []
  }
}

/** Fetch a single quest by ID (full data). */
export async function fetchArdbQuest(id: string): Promise<ArdbQuest | null> {
  try {
    return await ardbFetch<ArdbQuest>(`/quests/${encodeURIComponent(id)}`)
  } catch (err) {
    console.error(`[ARDB] Failed to fetch quest ${id}:`, err)
    return null
  }
}

/** Fetch all ARC enemies (basic data). MetaForge has no /enemies endpoint — use this. */
export async function fetchArdbEnemies(): Promise<ArdbEnemy[]> {
  try {
    const data = await ardbFetch<unknown>('/arc-enemies')
    return Array.isArray(data) ? (data as ArdbEnemy[]) : []
  } catch (err) {
    console.error('[ARDB] Failed to fetch arc-enemies:', err)
    return []
  }
}

/** Fetch a single ARC enemy by ID (full data). */
export async function fetchArdbEnemy(id: string): Promise<ArdbEnemy | null> {
  try {
    return await ardbFetch<ArdbEnemy>(`/arc-enemies/${encodeURIComponent(id)}`)
  } catch (err) {
    console.error(`[ARDB] Failed to fetch enemy ${id}:`, err)
    return null
  }
}

/** Helper: resolve an ARDB image path to a full URL. */
export function ardbImageUrl(path: string | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${ARDB_STATIC}/${path.replace(/^\//, '')}`
}
