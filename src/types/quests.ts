/**
 * quests.ts — Shared quest type definitions for RaiderForge
 *
 * Data sources:
 *   MetaForge /api/arc-raiders/quests — 40 quests, position data, trader_name (string)
 *   ARDB /api/quests                  — 84 quests, maps[] filter, trader object + icons, steps[]
 *
 * MergedQuest is the runtime type used across map components.
 * It is built by mergeAndFilterQuests() in src/lib/quests/questUtils.ts.
 */

// ── MetaForge quest shape ─────────────────────────────────────────────────────
// Response: GET https://metaforge.app/api/arc-raiders/quests
// Wrapper:  { data: MfQuest[], pagination: {...} }

export type MfQuestReward = {
  id: string
  item_id: string
  quantity: string
  item: {
    id: string
    icon: string   // full CDN URL
    name: string
    rarity: string
    item_type: string
  }
}

export type MfQuestRaw = {
  id: string
  name: string
  objectives: string[]
  xp: number
  granted_items: unknown[]
  required_items: unknown[]
  rewards: MfQuestReward[]
  trader_name: string          // "Celeste" | "Apollo" | "Lance" | "Shani" | "TianWen"
  sort_order: number
  /**
   * Map coordinates in MetaForge's internal coordinate system.
   * Empirically determined to be a ~1024×1024 scale (not 8192×8192).
   * See MF_QUEST_COORD_MAX in questUtils.ts.
   * null when MetaForge has no position for this quest.
   */
  position: { x: number; y: number } | null
  locations: unknown[]
  marker_category: string | null
  image: string   // CDN URL
  guide_links: Array<{ url: string; label: string }>
  created_at: string
  updated_at: string
}

// ── ARDB quest shape ──────────────────────────────────────────────────────────
// Response: GET https://ardb.app/api/quests  (plain array, no wrapper)

export type ArdbQuestTrader = {
  id: string
  name: string
  type: string
  description: string
  image: string    // relative path — prefix https://ardb.app/static
  icon: string     // relative path — prefix https://ardb.app/static
}

export type ArdbQuestItem = {
  id: string
  name: string
  icon: string     // relative path — prefix https://ardb.app/static
  rarity: string
  type: string
  value: number
  foundIn?: string[]
  updatedAt?: string
}

export type ArdbQuestRaw = {
  id: string
  title: string
  description: string
  maps: Array<{ id: string; name: string }>
  steps: Array<{ title: string; amount?: number }>
  trader: ArdbQuestTrader
  requiredItems: Array<{ item: ArdbQuestItem; amount: number }>
  xpReward: number
  updatedAt: string
}

// ── Merged runtime type ───────────────────────────────────────────────────────
// Built by mergeAndFilterQuests() — combines ARDB detail with MetaForge positions.

export type MergedQuest = {
  /** Normalised display name (from ARDB title, same string as MetaForge name) */
  name: string

  /**
   * Lowercase trader ID from ARDB (ardb.trader.id.toLowerCase()).
   * ARDB uses underscores: "celeste" | "apollo" | "lance" | "shani" | "tian_wen"
   * Note: "tian_wen" uses an underscore, not a space.
   */
  traderId: string
  /** Display name: "Celeste" | "Apollo" | "Lance" | "Shani" | "Tian Wen" */
  traderName: string
  /** Full ARDB static URL for trader icon, or null if unavailable */
  traderIcon: string | null

  /** Detailed step objectives from ARDB */
  steps: Array<{ title: string; amount?: number }>

  /** Required items with full URLs */
  requiredItems: Array<{
    name: string
    icon: string   // full URL (https://ardb.app/static/...)
    rarity: string
    amount: number
  }>

  /** Reward items from MetaForge (full CDN URLs) */
  rewards: Array<{
    name: string
    icon: string   // full MetaForge CDN URL
    rarity: string
    quantity: string
  }>

  /**
   * Raw MetaForge position in its internal ~1024×1024 coordinate space.
   * null when MetaForge has no position for this quest (majority of ARDB-only quests).
   * Converted to Leaflet LatLng by mfPositionToLatLng() in questUtils.ts.
   */
  position: { x: number; y: number } | null

  /** Maps this quest appears on (from ARDB) */
  maps: Array<{ id: string; name: string }>

  /** MetaForge quest art CDN URL, or null if unavailable */
  image: string | null

  /** XP reward from MetaForge (0 when not available) */
  xp: number

  /** First MetaForge guide link URL, or null if no guides listed */
  guideUrl: string | null
}
