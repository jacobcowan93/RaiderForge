/**
 * metaforgeMapData.ts
 *
 * Normalization layer for MetaForge /api/game-map-data responses.
 *
 * STATUS (2026-03):
 *   The endpoint https://metaforge.app/api/game-map-data is currently
 *   returning HTTP 500. This module is implemented defensively — all
 *   functions return empty arrays when the API is unavailable or the
 *   response contains no recognizable data.
 *
 *   When the endpoint comes online, the normalizers here will process
 *   the response into typed LootAreaMarker[] for display on the map.
 *   Update RawMfZone field names and normalizeTier() once live data
 *   confirms the actual schema.
 *
 * SCHEMA NOTE:
 *   The MetaForge /api/game-map-data schema is not publicly documented.
 *   Types and field names below are best-effort based on MetaForge's
 *   other endpoints and common API conventions. The normalizer tries
 *   multiple plausible field names (lootAreas, loot_areas, zones,
 *   hotspots) to survive schema variation without crashing.
 *
 * DATA POLICY:
 *   Only name and positional data is consumed from this endpoint.
 *   No loot probabilities, spawn rates, or drop tables are rendered.
 *   Loot area markers indicate zones only — not quantity or probability.
 *   Attribution: "Map data via MetaForge (metaforge.app/arc-raiders)"
 */

import { fetchMfMapData } from '../../api/metaforgeService'
import type { LootAreaMarker, LootAreaTier } from '../../types/mapLayers'

// ── RF → MetaForge map ID mapping ─────────────────────────────────────────────

/**
 * Maps RaiderForge map IDs to the query param MetaForge may expect.
 * Mirrors the ARDB_MAP_ID_TO_RF pattern in questUtils.ts (inverted).
 * Verify against live API responses and update if MetaForge uses different IDs.
 */
const RF_TO_MF_MAP_ID: Record<string, string> = {
  'dam-battlegrounds': 'dam',
  'burial-city':       'buried-city',
  'spaceport':         'spaceport',
  'blue-gate':         'blue-gate',
  'stella-montis':     'stella-montis',
}

// ── Raw schema types (best-effort, MetaForge undocumented) ────────────────────

/**
 * Best-effort shape for a single loot zone entry.
 * All fields are optional — the actual API schema is unconfirmed.
 * The normalizer handles absent or differently-named fields gracefully.
 */
type RawMfZone = {
  id?:       string
  name?:     string
  label?:    string
  tier?:     string
  quality?:  string
  position?: { x?: number; y?: number }
  coords?:   { x?: number; y?: number }
  [key: string]: unknown
}

/**
 * Best-effort shape for the root response or per-map slice.
 * Multiple field names are tried to handle both flat and nested responses.
 */
type RawMfMapSlice = {
  lootAreas?:  RawMfZone[]
  loot_areas?: RawMfZone[]
  zones?:      RawMfZone[]
  hotspots?:   RawMfZone[]
  [key: string]: unknown
}

// ── Normalization helpers ─────────────────────────────────────────────────────

/**
 * Extract { x, y } from a raw zone object.
 * Accepts both `position` and `coords` field names.
 * Returns null if coordinates are missing or non-numeric.
 */
function extractPos(raw: RawMfZone): { x: number; y: number } | null {
  const p = raw.position ?? raw.coords
  if (!p) return null
  if (typeof p.x !== 'number' || typeof p.y !== 'number') return null
  return { x: p.x, y: p.y }
}

/**
 * Map a raw tier or quality string to a typed LootAreaTier.
 * Defaults to 'medium' for unrecognized or absent values.
 */
function normalizeTier(raw?: string): LootAreaTier {
  const t = (raw ?? '').toLowerCase()
  if (t === 'high'   || t === 'elite'  || t === 'rare')   return 'high'
  if (t === 'low'    || t === 'common' || t === 'basic')   return 'low'
  return 'medium'
}

/**
 * Normalize a raw array of zone objects into LootAreaMarker[].
 * Silently skips entries with missing, non-object, or invalid-position values.
 */
function normalizeZones(raw: unknown[]): LootAreaMarker[] {
  const out: LootAreaMarker[] = []
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (!item || typeof item !== 'object') continue
    const r = item as RawMfZone
    const pos = extractPos(r)
    if (!pos) continue
    out.push({
      id:       String(r.id ?? `mf-zone-${i}`),
      name:     String(r.name ?? r.label ?? 'Loot Zone'),
      tier:     normalizeTier(r.tier ?? (typeof r.quality === 'string' ? r.quality : undefined)),
      position: pos,
    })
  }
  return out
}

/**
 * Extract the per-map data slice from a raw MetaForge response.
 *
 * MetaForge may return either:
 *   a) A keyed object: { "dam": { lootAreas: [...] }, "spaceport": {...} }
 *   b) A flat object:  { lootAreas: [...] }  (single-map query)
 *
 * Attempts (a) first using the MetaForge map ID, then falls back to (b).
 */
function extractSlice(raw: Record<string, unknown>, mfMapId: string): RawMfMapSlice {
  const keyed = raw[mfMapId]
  if (keyed && typeof keyed === 'object' && !Array.isArray(keyed)) {
    return keyed as RawMfMapSlice
  }
  return raw as RawMfMapSlice
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch and normalize MetaForge loot area markers for a given RF map ID.
 *
 * Returns an empty array when:
 *   - The API returns HTTP 500 or any other error  (graceful — fetchMfMapData
 *     already catches and returns {} on error)
 *   - The response contains no recognizable loot area fields
 *   - The RF map ID has no known MetaForge equivalent
 *
 * Safe to call from Next.js server components.
 * TTL is 30 min, handled by the metaforgeService cache layer.
 *
 * @param rfMapId  RaiderForge map ID, e.g. 'dam-battlegrounds'
 */
export async function getMetaforgeMapLootAreas(rfMapId: string): Promise<LootAreaMarker[]> {
  try {
    const mfMapId = RF_TO_MF_MAP_ID[rfMapId]
    if (!mfMapId) return []

    const raw = await fetchMfMapData({ mapId: mfMapId })

    // fetchMfMapData returns {} when the API errors — nothing to normalize.
    if (!raw || Object.keys(raw).length === 0) return []

    const slice = extractSlice(raw as Record<string, unknown>, mfMapId)

    // Try multiple known field names for loot zone arrays.
    const rawZones =
      slice.lootAreas ??
      slice.loot_areas ??
      slice.zones ??
      slice.hotspots ??
      []

    return normalizeZones(Array.isArray(rawZones) ? rawZones : [])
  } catch (err) {
    console.error('[RaiderForge] getMetaforgeMapLootAreas error:', err)
    return []
  }
}
