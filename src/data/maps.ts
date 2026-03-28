/**
 * maps.ts
 * Static metadata for the 5 known ARC Raiders maps.
 *
 * Presentational/structural data based on known game content.
 * Live event/condition data comes from MetaForge /events-schedule.
 *
 * Tile configuration sourced from ardb.app — embedded in /api/quests/{id} responses.
 * All 5 maps share: 8192×8192px native size, 512px tiles, zoom range 1–5.
 */

export type MapFloor = {
  id: string
  label: string
  image: string  // static fallback image (used when tiles are unavailable)
}

// --- Tile Configuration Types ---
// Source: ardb.app /api/quests/{id} → maps[].tileLayers[]
// Attribution requirement: display "Data provided by ardb.app" (see Footer)

export type TileLayerDef = {
  id: string
  label: string
  /**
   * ARDB CDN tile URL template.
   * Leaflet performs direct string substitution: {z}=zoom, {x}=column, {y}=row.
   *
   * ARDB uses two axis-order conventions in the URL path:
   *   dam / spaceport:                    .../tiles/{z}/{y}/{x}.webp  (row before column)
   *   buried-city / blue-gate / stella-montis: .../tiles/{z}/{x}/{y}.webp  (column before row)
   *
   * Both work directly in Leaflet since {x} and {y} are always substituted correctly
   * by string replacement — the order in the URL path is just how ARDB organises files.
   */
  tileUrl: string
  /** Highest zoom level with actual tile data. Leaflet upscales beyond this. */
  maxNativeZoom: number
}

export type MapTileConfig = {
  /** One layer for standard maps, two layers for Stella Montis (upper + lower). */
  layers: TileLayerDef[]
  /** Tile size in pixels. All ARDB maps: 512. */
  tileSize: number
  /** Full map width/height in pixels at maxNativeZoom. All ARDB maps: 8192. */
  mapPixelSize: number
  /** Maximum Leaflet zoom level (tiles are upscaled above maxNativeZoom). All ARDB maps: 5. */
  maxZoom: number
  /** Minimum Leaflet zoom level. All ARDB maps: 1. */
  minZoom: number
}

export type MapMeta = {
  id: string
  displayName: string
  subtitle: string
  description: string
  risk: 'Low' | 'Medium' | 'High' | 'Extreme'
  image: string | null          // null for multi-floor maps (use floors[0].image)
  mapType: 'standard' | 'multi-floor'
  floors?: MapFloor[]
  features: string[]
  /** ARDB tile config. Present for all 5 maps. Used by MapTileViewer. */
  tileConfig?: MapTileConfig
}

export const MAPS: MapMeta[] = [
  {
    id: 'dam-battlegrounds',
    displayName: 'Dam Battlegrounds',
    subtitle: 'Industrial Warzone',
    description:
      'Dam Battlegrounds drops you into the shadow of the Alcantara Power Plant, a massive hydroelectric dam looming over a toxic, flooded landscape. ' +
      'The broken spillways and drowned lowlands are slowly being reclaimed by tough plant life and hardy wildlife, creating a strange mix of heavy industry and wild overgrowth. ' +
      "It feels like a monument to the old world's power, now reduced to a quiet husk where raiders pick through forgotten infrastructure for one more haul.",
    risk: 'High',
    image: '/images/ARC Raiders Maps/dam-battleground.png',
    mapType: 'standard',
    features: ['Harvester Spawns', 'Contested POIs', 'Industrial Loot'],
    tileConfig: {
      // ARDB map ID: "dam" — maxNativeZoom 4 (16×16 tiles = 8192px at zoom 4)
      // URL axis order: {z}/{y}/{x} — row before column in path
      layers: [
        {
          id: 'dam',
          label: 'Dam Battlegrounds',
          tileUrl: 'https://ardb.app/static/map-tiles/dam/{z}/{y}/{x}.webp',
          maxNativeZoom: 4,
        },
      ],
      tileSize: 512,
      mapPixelSize: 8192,
      maxZoom: 5,
      minZoom: 1,
    },
  },
  {
    // Stable id / route `/maps/burial-city` and progress key — unchanged for compatibility.
    // User-facing name is "Buried City" (displayName + tile label below).
    id: 'burial-city',
    displayName: 'Buried City',
    subtitle: 'Urban Ruins',
    description:
      'Buried City sits half-swallowed by dunes in a harsh, wind-scoured desert. Here, rusted cars, faded billboards, and crumbling storefronts hint at a warmer, more human past that predates the cold steel of the Exodus age. ' +
      'Tight streets and lonely plazas tell the story of a town that once thrived, now reduced to a sand-choked relic where every alley and rooftop hides both danger and opportunity.',
    risk: 'Medium',
    image: '/images/ARC Raiders Maps/buried_city.png',
    mapType: 'standard',
    features: ['Urban Cover', 'Cache Spawns', 'ARC Nests'],
    tileConfig: {
      // ARDB map ID: "buried-city" — tiles served from buried-city-v2 directory
      // URL axis order: {z}/{x}/{y} — column before row in path
      layers: [
        {
          id: 'buried-city',
          label: 'Buried City',
          tileUrl: 'https://ardb.app/static/map-tiles/buried-city-v2/{z}/{x}/{y}.webp',
          maxNativeZoom: 3,
        },
      ],
      tileSize: 512,
      mapPixelSize: 8192,
      maxZoom: 5,
      minZoom: 1,
    },
  },
  {
    id: 'spaceport',
    displayName: 'Spaceport',
    subtitle: 'Launch Complex',
    description:
      'Spaceport centers on Acerra Spaceport, a once-grand launch facility built to send shuttles skyward and ferry people off a failing Earth. ' +
      'Towering gantries, grounded vessels, and sprawling terminals speak to an era of desperate ambition, when every launch meant another gamble on survival. ' +
      "Today it's a graveyard of stalled dreams, packed with cargo, checkpoints, and launch towers that raiders comb for valuables while ARC forces guard the remnants of humanity's escape plan.",
    risk: 'Extreme',
    image: '/images/ARC Raiders Maps/spaceport.png',
    mapType: 'standard',
    features: ['Launch Tower Loot', 'High-Tech Salvage', 'ARC Patrols'],
    tileConfig: {
      // ARDB map ID: "spaceport"
      // URL axis order: {z}/{y}/{x} — row before column in path
      layers: [
        {
          id: 'spaceport',
          label: 'Spaceport',
          tileUrl: 'https://ardb.app/static/map-tiles/spaceport/{z}/{y}/{x}.webp',
          maxNativeZoom: 3,
        },
      ],
      tileSize: 512,
      mapPixelSize: 8192,
      maxZoom: 5,
      minZoom: 1,
    },
  },
  {
    id: 'blue-gate',
    displayName: 'Blue Gate',
    subtitle: 'Frontier Outpost',
    description:
      'The Blue Gate takes you high into the mountains, where a strange gateway complex dominates the skyline. ' +
      'The region blends open plateaus, scattered villages, twisting tunnels, and buried facilities into one large interconnected battleground. ' +
      'Wide sightlines and sudden drops into enclosed compounds keep you constantly shifting between long-range engagements in the open air and frantic close-quarters skirmishes beneath the rock.',
    risk: 'Medium',
    image: '/images/ARC Raiders Maps/blue_gate.png',
    mapType: 'standard',
    features: ['Open Terrain', 'Fortified Positions', 'Resource Nodes'],
    tileConfig: {
      // ARDB map ID: "blue-gate" — tiles served from blue-gate-v2 directory
      // URL axis order: {z}/{x}/{y} — column before row in path
      layers: [
        {
          id: 'blue-gate',
          label: 'Blue Gate',
          tileUrl: 'https://ardb.app/static/map-tiles/blue-gate-v2/{z}/{x}/{y}.webp',
          maxNativeZoom: 3,
        },
      ],
      tileSize: 512,
      mapPixelSize: 8192,
      maxZoom: 5,
      minZoom: 1,
    },
  },
  {
    id: 'stella-montis',
    displayName: 'Stella Montis',
    subtitle: 'Mountain Facility',
    description:
      'Stella Montis is a remote research outpost tucked into snow-covered peaks, far from the relative safety of the lowlands. ' +
      "The complex once served as a final safeguard for humanity's long-term survival, with labs and infrastructure dedicated to preserving what little remained. " +
      'Now, icy walkways, buried structures, and frozen ravines form a chilly maze where raiders risk frostbite and ARC patrols alike in search of the secrets and supplies left behind.',
    risk: 'High',
    image: null,
    mapType: 'multi-floor',
    floors: [
      { id: 'upper', label: 'Upper Level', image: '/images/ARC Raiders Maps/stella_montis_map_upper_level.png.webp' },
      { id: 'lower', label: 'Lower Level', image: '/images/ARC Raiders Maps/stella_montis_map_lower_level.png.webp' },
    ],
    features: ['Multi-Level', 'Night Raids', 'Research Loot'],
    tileConfig: {
      // Stella Montis has two tile sets, one per floor:
      //   l2 = upper level ("Top" in ARDB) → floors[0] = Upper Level
      //   l1 = lower level ("Bottom" in ARDB) → floors[1] = Lower Level
      //
      // Layer index matches floors[] index so MapImageDisplay can use activeFloor
      // as the activeLayerIndex for both static fallback and tile rendering.
      //
      // URL axis order: {z}/{x}/{y} for both layers
      layers: [
        {
          id: 'stella-montis-upper',
          label: 'Upper Level',
          tileUrl: 'https://ardb.app/static/map-tiles/stella-montis-l2/{z}/{x}/{y}.webp',
          maxNativeZoom: 3,
        },
        {
          id: 'stella-montis-lower',
          label: 'Lower Level',
          tileUrl: 'https://ardb.app/static/map-tiles/stella-montis-l1/{z}/{x}/{y}.webp',
          maxNativeZoom: 3,
        },
      ],
      tileSize: 512,
      mapPixelSize: 8192,
      maxZoom: 5,
      minZoom: 1,
    },
  },
]

/**
 * Narrative overview for Practice Range. Not part of `MAPS` — there is no tactical tile route for it on RaiderForge.
 */
export const PRACTICE_RANGE_OVERVIEW = {
  displayName: 'Practice Range',
  description:
    "Practice Range is a secluded firing ground hidden in a quiet mountain bowl, safely removed from the worst of ARC's attention. " +
    'Constant gunfire and explosions echo off the surrounding cliffs, scrambling ARC sensors and creating a rare pocket of open-air security for raiders. ' +
    "It's the perfect place to test weapons, refine your aim, and unwind under a clear sky, with stargazing and target practice sharing the same horizon.",
} as const

export function getMapById(id: string): MapMeta | undefined {
  return MAPS.find(m => m.id === id)
}

export function getMapThumbnail(map: MapMeta): string {
  if (map.image) return map.image
  if (map.floors && map.floors.length > 0) return map.floors[0].image
  return '/images/ARC_Maps.PNG'
}
