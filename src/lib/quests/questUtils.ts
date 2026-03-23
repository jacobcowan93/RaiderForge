/**
 * questUtils.ts
 *
 * Utilities for merging MetaForge + ARDB quest data, filtering by map,
 * and converting MetaForge positions to Leaflet CRS.Simple coordinates.
 *
 * Data flow:
 *   1. Fetch MetaForge /quests → MfQuestRaw[]   (40 quests, has position)
 *   2. Fetch ARDB /quests      → ArdbQuestRaw[] (84 quests, has maps[])
 *   3. mergeQuests()           → MergedQuest[]  (joined by normalised name)
 *   4. filterQuestsByMap()     → MergedQuest[]  (filtered to current RF map ID)
 *
 * Coordinate transform note:
 *   MetaForge stores quest positions in a game-world coordinate space.
 *   mfPositionToPixels() normalises these to [0, mapPixelSize] pixel coordinates
 *   using empirically-observed world bounds (see MF_WORLD_BOUNDS below).
 *   mfPositionToLatLng() then converts pixels → Leaflet CRS.Simple LatLng
 *   via map.unproject([px, py], maxNativeZoom).
 *
 * CALIBRATION STATUS (verified 2026-03 from live API — 40 quests):
 *   MetaForge uses a game-world coordinate space, NOT a normalised [0, 1024] space.
 *   Observed ranges across all 40 quests:
 *     X: approximately -960  to +1509
 *     Y: approximately  +319 to +7664
 *   MF_WORLD_BOUNDS reflects this range with padding.
 *
 *   IMPORTANT CAVEAT:
 *   Some quests appear on multiple maps but carry a single position — suggesting
 *   MetaForge coordinates may be global world-space coordinates that span all maps,
 *   rather than per-map tile coordinates. Marker placement is therefore approximate.
 *   Positions within the observed world-space bounds are rendered; outliers are dropped.
 *   Refine MF_WORLD_BOUNDS through in-game calibration when possible.
 */

import type { MfQuestRaw, ArdbQuestRaw, MergedQuest } from '../../types/quests'
import { ARDB_STATIC } from '../../api/ardbService'
import type { MapTileConfig } from '../../data/maps'
import { type WorldBounds, GLOBAL_WORLD_BOUNDS } from '../../data/mapCalibration'

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * @deprecated Use GLOBAL_WORLD_BOUNDS from src/data/mapCalibration.ts.
 * MF_QUEST_COORD_MAX = 1024 was incorrect — live API shows MetaForge uses a
 * game-world coordinate space, not a 0-1024 space.
 * Kept for backward compatibility if any external code references it.
 */
export const MF_QUEST_COORD_MAX = 1024

/**
 * Maps ARDB map IDs to RaiderForge route IDs.
 * ARDB uses: dam | spaceport | buried-city | blue-gate | stella-montis
 * RF uses:   dam-battlegrounds | spaceport | burial-city | blue-gate | stella-montis
 */
export const ARDB_MAP_ID_TO_RF: Record<string, string> = {
  'dam':           'dam-battlegrounds',
  'spaceport':     'spaceport',
  'buried-city':   'burial-city',
  'blue-gate':     'blue-gate',
  'stella-montis': 'stella-montis',
}

/**
 * Known ARDB title typos that prevent name-based joining with MetaForge.
 * Key = incorrect ARDB title, value = corrected form (matching MetaForge name).
 * Update when ARDB fixes upstream or new mismatches are discovered.
 */
const ARDB_TITLE_CORRECTIONS: Record<string, string> = {
  'A Primse Specimen': 'A Prime Specimen',  // ARDB typo, verified 2026-03
}

// ── Name normalisation ────────────────────────────────────────────────────────

/**
 * Normalise a quest name for comparison.
 * Handles minor punctuation/spacing differences between MetaForge and ARDB.
 * Example: "A Bad Feeling!" → "a bad feeling"
 */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // strip punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Merge ─────────────────────────────────────────────────────────────────────

/**
 * Merge MetaForge and ARDB quest arrays into a unified MergedQuest[].
 *
 * Join strategy: normalised name comparison (ARDB title ↔ MetaForge name).
 * - ARDB quests present in both → enriched with MetaForge position + rewards
 * - ARDB quests with no MetaForge match → position: null, rewards: []
 * - MetaForge quests with no ARDB match → excluded (no maps[] data to filter)
 *
 * Pre-processing: known ARDB title typos are corrected before normalisation
 * (see ARDB_TITLE_CORRECTIONS) to prevent silent join failures.
 *
 * Result is driven by ARDB's 84-quest dataset since it has the maps[] field
 * needed for per-map filtering.
 */
export function mergeQuests(
  mfQuests: MfQuestRaw[],
  ardbQuests: ArdbQuestRaw[],
): MergedQuest[] {
  // Build MetaForge lookup by normalised name
  const mfByName = new Map<string, MfQuestRaw>()
  for (const q of mfQuests) {
    mfByName.set(normalise(q.name), q)
  }

  return ardbQuests.map(ardb => {
    // Apply known typo corrections before normalising for join
    const correctedTitle = ARDB_TITLE_CORRECTIONS[ardb.title] ?? ardb.title
    const mf = mfByName.get(normalise(correctedTitle)) ?? null

    return {
      name: ardb.title,

      traderId:   ardb.trader.id.toLowerCase(),
      traderName: ardb.trader.name,
      traderIcon: ardb.trader.icon
        ? `${ARDB_STATIC}/${ardb.trader.icon.replace(/^\//, '')}`
        : null,

      steps: ardb.steps,

      requiredItems: ardb.requiredItems.map(ri => ({
        name:   ri.item.name,
        icon:   `${ARDB_STATIC}/${ri.item.icon.replace(/^\//, '')}`,
        rarity: ri.item.rarity,
        amount: ri.amount,
      })),

      rewards: mf
        ? mf.rewards.map(r => ({
            name:     r.item.name,
            icon:     r.item.icon,  // already a full MetaForge CDN URL
            rarity:   r.item.rarity,
            quantity: r.quantity,
          }))
        : [],

      position: mf?.position ?? null,

      maps: ardb.maps,

      image:    mf?.image ?? null,
      xp:       mf?.xp    ?? 0,
      guideUrl: mf?.guide_links?.[0]?.url ?? null,
    } satisfies MergedQuest
  })
}

// ── Filter ────────────────────────────────────────────────────────────────────

/**
 * Filter merged quests to those that appear on a given RaiderForge map ID.
 * Uses ARDB's maps[] field (converted from ARDB IDs → RF IDs).
 */
export function filterQuestsByMap(quests: MergedQuest[], rfMapId: string): MergedQuest[] {
  return quests.filter(q =>
    q.maps.some(m => ARDB_MAP_ID_TO_RF[m.id] === rfMapId),
  )
}

// ── Coordinate transform ──────────────────────────────────────────────────────

/**
 * Convert a MetaForge quest position to Leaflet pixel coordinates
 * for use with map.unproject().
 *
 * MetaForge positions are in a game-world coordinate space.
 * We normalise via min-max scaling to [0, mapPixelSize] using the
 * provided worldBounds (from mapCalibration.ts). Falls back to
 * GLOBAL_WORLD_BOUNDS if no per-map bounds are supplied.
 *
 * CALIBRATION NOTE:
 *   worldBounds is empirically derived. Marker placement is approximate
 *   until cross-referenced against known in-game locations.
 *   See src/data/mapCalibration.ts for per-map calibration status and
 *   instructions for deriving verified bounds.
 *
 *   Some quests appear on multiple maps with a single shared position —
 *   the coordinate space appears to be global (not per-map-zone).
 *   The same (x, y) therefore renders at the same relative position on
 *   every map it appears on. This is expected given current MF data.
 *
 * @param position    Raw MetaForge { x, y } world-space position, or null.
 * @param tileConfig  Tile config for the target map (provides mapPixelSize).
 * @param worldBounds Calibrated world bounds for this map. If omitted,
 *                    GLOBAL_WORLD_BOUNDS is used as fallback.
 *
 * Returns null if position is null or lies outside the supplied bounds.
 */
export function mfPositionToPixels(
  position: { x: number; y: number } | null,
  tileConfig: MapTileConfig,
  worldBounds?: WorldBounds,
): [number, number] | null {
  if (!position) return null

  const bounds = worldBounds ?? GLOBAL_WORLD_BOUNDS
  const { xMin, xMax, yMin, yMax } = bounds
  const xRange = xMax - xMin
  const yRange = yMax - yMin

  // Normalise to [0, 1] using provided world-space bounds
  const xNorm = (position.x - xMin) / xRange
  const yNorm = (position.y - yMin) / yRange

  // Discard positions outside the calibrated bounds — data anomaly or
  // new content beyond the current calibration range
  if (xNorm < 0 || xNorm > 1 || yNorm < 0 || yNorm > 1) {
    return null
  }

  return [
    xNorm * tileConfig.mapPixelSize,
    yNorm * tileConfig.mapPixelSize,
  ]
}
