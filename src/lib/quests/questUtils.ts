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
 *   MetaForge stores quest positions in an internal ~1024×1024 coordinate space.
 *   Our tile maps are 8192×8192 pixels at maxNativeZoom.
 *   mfPositionToPixels() scales MetaForge coords to pixel space.
 *   mfPositionToLatLng() then converts pixels → Leaflet CRS.Simple LatLng
 *   via map.unproject([px, py], maxNativeZoom).
 *
 * CALIBRATION NOTE:
 *   MF_QUEST_COORD_MAX = 1024 is an empirical assumption based on the observed
 *   position values (e.g. {x:210, y:800}) being well below 8192. If markers
 *   appear misaligned, adjust MF_QUEST_COORD_MAX. Common values: 512, 1024, 2048.
 */

import type { MfQuestRaw, ArdbQuestRaw, MergedQuest } from '../../types/quests'
import { ARDB_STATIC } from '../../api/ardbService'
import type { MapTileConfig } from '../../data/maps'

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Assumed range of MetaForge quest position coordinates.
 * MetaForge positions like {x:210, y:800} suggest a ~0–1024 space.
 * Adjust if map markers appear significantly off-position when tested.
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
    const mf = mfByName.get(normalise(ardb.title)) ?? null

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
 * MetaForge positions are in a ~0–MF_QUEST_COORD_MAX coordinate space.
 * We scale linearly to the tile map's pixel dimensions.
 *
 * Returns null if the position is null or out of expected bounds.
 */
export function mfPositionToPixels(
  position: { x: number; y: number } | null,
  tileConfig: MapTileConfig,
): [number, number] | null {
  if (!position) return null

  // Bounds check: discard positions clearly outside the MetaForge coord space
  if (
    position.x < 0 || position.x > MF_QUEST_COORD_MAX ||
    position.y < 0 || position.y > MF_QUEST_COORD_MAX
  ) {
    return null
  }

  const scale = tileConfig.mapPixelSize / MF_QUEST_COORD_MAX
  return [
    position.x * scale,
    position.y * scale,
  ]
}
