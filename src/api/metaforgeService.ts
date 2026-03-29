/**
 * metaforgeService.ts
 *
 * MetaForge ARC Raiders API client.
 * Built from MetaForge's public API documentation: https://metaforge.app/arc-raiders/api
 *
 * Attribution (required by MetaForge for public projects):
 *   "Some ARC Raiders data provided by MetaForge (metaforge.app/arc-raiders)"
 *
 * IMPORTANT: Endpoints may change or break without warning. Cache defensively.
 * Commercial/monetized use requires prior contact via MetaForge Discord.
 */

import type { MfEvent } from '../lib/events/conditions'
import type { MfQuestRaw } from '../types/quests'

// ── Base URLs ────────────────────────────────────────────────────────────────
const ARC_BASE = 'https://metaforge.app/api/arc-raiders'
// NOTE: game-map-data is NOT under /arc-raiders — it uses a separate path
const MAP_DATA_URL = 'https://metaforge.app/api/game-map-data'

export const METAFORGE_ATTRIBUTION = 'Some ARC Raiders data provided by MetaForge (metaforge.app/arc-raiders)'

// ── TTL constants (milliseconds) ─────────────────────────────────────────────
const TTL_STATIC = 30 * 60 * 1000       // 30 min — items, arcs, maps
const TTL_SEMI_STATIC = 15 * 60 * 1000  // 15 min — quests, traders
const TTL_DYNAMIC = 60 * 1000           // 60s — events-schedule (live conditions; align with CDN revalidate)

// ── In-memory cache ───────────────────────────────────────────────────────────
type CacheEntry = { data: unknown; expires: number }
const cache = new Map<string, CacheEntry>()

async function mfFetch<T>(url: string, ttlMs: number, params?: Record<string, string>): Promise<T> {
  const cacheKey = params ? `${url}?${new URLSearchParams(params)}` : url

  const cached = cache.get(cacheKey)
  if (cached && Date.now() < cached.expires) {
    return cached.data as T
  }

  const fullUrl = params ? `${url}?${new URLSearchParams(params)}` : url
  const res = await fetch(fullUrl, {
    headers: { Accept: 'application/json' },
    // next.js cache revalidation — aligns with our in-memory TTL
    next: { revalidate: Math.floor(ttlMs / 1000) },
  })

  if (!res.ok) {
    throw new Error(`MetaForge API error: ${res.status} ${res.statusText} (${fullUrl})`)
  }

  const data = (await res.json()) as T
  cache.set(cacheKey, { data, expires: Date.now() + ttlMs })
  return data
}

/** Clear the in-memory cache (useful after known API updates). */
export function clearMfCache(): void {
  cache.clear()
}

// ── Type definitions ──────────────────────────────────────────────────────────
// These are best-effort types based on MetaForge docs + community knowledge.
// The API schema is not fully published — fields marked optional may not always be present.

export type MfItem = {
  id?: string
  name?: string
  description?: string
  category?: string
  rarity?: string
  weight?: number
  value?: number
  components?: MfItem[]
  [key: string]: unknown
}

export type MfArc = {
  id?: string
  name?: string
  description?: string
  loot?: MfItem[]
  [key: string]: unknown
}

export type MfQuest = {
  id?: string
  name?: string
  description?: string
  requiredItems?: MfItem[]
  rewards?: unknown[]
  [key: string]: unknown
}

export type MfTrader = {
  id?: string
  name?: string
  inventory?: MfItem[]
  [key: string]: unknown
}

export type MfMapData = {
  [key: string]: unknown
}

// ── Public API functions ──────────────────────────────────────────────────────

export type MfEventsScheduleResult = {
  events: MfEvent[]
  /** False when the upstream request failed (caller should treat like empty + use fallbacks). */
  ok: boolean
}

/** Single row from GET /api/arc-raiders/weekly-trials */
export type MfWeeklyTrialRow = {
  id: string
  name: string
  image_url?: string
  guide_link?: string | null
  video_link?: string | null
  is_active?: boolean
  upcoming?: boolean
  has_event_header?: boolean
  sort_order?: number
  database_links?: unknown[]
  [key: string]: unknown
}

/** API may send ISO strings or Unix seconds (number). Normalized to ISO string for UI. */
export type MfWeeklyTrialsPayload = {
  data: MfWeeklyTrialRow[]
  activeWindowEnd: string | null
  nextWindowStart: string | null
}

function normalizeMfWeeklyWindowTime(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'number' && Number.isFinite(v)) {
    const ms = v < 1e12 ? v * 1000 : v
    return new Date(ms).toISOString()
  }
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed)
      const ms = n < 1e12 ? n * 1000 : n
      return new Date(ms).toISOString()
    }
    const d = new Date(trimmed)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  return null
}

export type MfWeeklyTrialsResult = MfWeeklyTrialsPayload & {
  ok: boolean
}

/**
 * Weekly Trials — 5 `is_active` (this week) + 5 `upcoming` (next week) per API contract.
 * TTL: 60s in-memory + Next fetch revalidate.
 */
export async function fetchMfWeeklyTrials(): Promise<MfWeeklyTrialsResult> {
  try {
    const raw = await mfFetch<unknown>(`${ARC_BASE}/weekly-trials`, TTL_DYNAMIC)
    if (!raw || typeof raw !== 'object') {
      return { data: [], activeWindowEnd: null, nextWindowStart: null, ok: false }
    }
    const o = raw as Record<string, unknown>
    const data = Array.isArray(o.data) ? (o.data as MfWeeklyTrialRow[]) : []
    const activeWindowEnd = normalizeMfWeeklyWindowTime(
        o.activeWindowEnd ?? o.active_window_end ?? o.rotation_end ?? o.rotationEnd,
    )
    const nextWindowStart = normalizeMfWeeklyWindowTime(
        o.nextWindowStart ?? o.next_window_start ?? o.rotation_start ?? o.rotationStart,
    )
    return { data, activeWindowEnd, nextWindowStart, ok: true }
  } catch (err) {
    console.error('[MetaForge] Failed to fetch weekly-trials:', err)
    return { data: [], activeWindowEnd: null, nextWindowStart: null, ok: false }
  }
}

/**
 * Fetch events-schedule (replaces deprecated /event-timers per MetaForge docs).
 * TTL: 60s in-memory + Next fetch revalidate.
 */
export async function fetchMfEventsScheduleWithStatus(): Promise<MfEventsScheduleResult> {
  try {
    const data = await mfFetch<unknown>(`${ARC_BASE}/events-schedule`, TTL_DYNAMIC)
    if (Array.isArray(data)) return { events: data as MfEvent[], ok: true }
    if (data && typeof data === 'object' && 'events' in data) {
      const ev = (data as { events: MfEvent[] }).events
      return { events: Array.isArray(ev) ? ev : [], ok: true }
    }
    return { events: [], ok: true }
  } catch (err) {
    console.error('[MetaForge] Failed to fetch events-schedule:', err)
    return { events: [], ok: false }
  }
}

/** Fetch the current ARC Raiders events schedule. On network failure returns []. */
export async function fetchMfEventsSchedule(): Promise<MfEvent[]> {
  const r = await fetchMfEventsScheduleWithStatus()
  return r.events
}

/**
 * Fetch map data from MetaForge.
 * NOTE: This uses the separate /api/game-map-data endpoint (NOT under /arc-raiders).
 * TTL: 30 min.
 */
export async function fetchMfMapData(params?: { mapId?: string }): Promise<MfMapData> {
  try {
    const queryParams = params?.mapId ? { mapId: params.mapId } : undefined
    return await mfFetch<MfMapData>(MAP_DATA_URL, TTL_STATIC, queryParams)
  } catch (err) {
    console.error('[MetaForge] Failed to fetch game-map-data:', err)
    return {}
  }
}

/** Fetch ARC Raiders items. Supports filtering and pagination. TTL: 30 min. */
export async function fetchMfItems(params?: Record<string, string>): Promise<MfItem[]> {
  try {
    const data = await mfFetch<unknown>(`${ARC_BASE}/items`, TTL_STATIC, params)
    return Array.isArray(data) ? (data as MfItem[]) : []
  } catch (err) {
    console.error('[MetaForge] Failed to fetch items:', err)
    return []
  }
}

/** Fetch ARC arcs (missions/activities). TTL: 30 min. */
export async function fetchMfArcs(params?: Record<string, string>): Promise<MfArc[]> {
  try {
    const data = await mfFetch<unknown>(`${ARC_BASE}/arcs`, TTL_STATIC, params)
    return Array.isArray(data) ? (data as MfArc[]) : []
  } catch (err) {
    console.error('[MetaForge] Failed to fetch arcs:', err)
    return []
  }
}

/**
 * Fetch quests with required items and rewards. TTL: 15 min.
 *
 * MetaForge wraps the response: { data: MfQuestRaw[], pagination: {...} }
 * We extract `.data` here; falls back to treating the response as a plain array
 * in case the shape changes.
 */
export async function fetchMfQuests(): Promise<MfQuestRaw[]> {
  try {
    const raw = await mfFetch<unknown>(`${ARC_BASE}/quests`, TTL_SEMI_STATIC)
    // Unwrap { data: [...], pagination: {...} } envelope
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as Record<string, unknown>).data)) {
      return (raw as { data: MfQuestRaw[] }).data
    }
    // Plain array fallback (future-proofing)
    if (Array.isArray(raw)) return raw as MfQuestRaw[]
    return []
  } catch (err) {
    console.error('[MetaForge] Failed to fetch quests:', err)
    return []
  }
}

/** Fetch trader inventories. TTL: 15 min. */
export async function fetchMfTraders(): Promise<MfTrader[]> {
  try {
    const data = await mfFetch<unknown>(`${ARC_BASE}/traders`, TTL_SEMI_STATIC)
    return Array.isArray(data) ? (data as MfTrader[]) : []
  } catch (err) {
    console.error('[MetaForge] Failed to fetch traders:', err)
    return []
  }
}
