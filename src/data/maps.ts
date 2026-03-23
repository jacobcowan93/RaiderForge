/**
 * maps.ts
 * Static metadata for the 5 known ARC Raiders maps.
 * This is presentational/structural data based on known game content.
 * Live event/condition data comes from MetaForge /events-schedule.
 */

export type MapFloor = {
  id: string
  label: string
  image: string
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
}

export const MAPS: MapMeta[] = [
  {
    id: 'dam-battlegrounds',
    displayName: 'Dam Battlegrounds',
    subtitle: 'Industrial Warzone',
    description: 'A massive hydroelectric dam complex turned contested battleground. High-value loot concentrated around the dam structure and surrounding industrial facilities.',
    risk: 'High',
    image: '/images/ARC Raiders Maps/dam-battleground.png',
    mapType: 'standard',
    features: ['Harvester Spawns', 'Contested POIs', 'Industrial Loot'],
  },
  {
    id: 'burial-city',
    displayName: 'Burial City',
    subtitle: 'Urban Ruins',
    description: 'The ruins of a once-thriving city, now silent and overgrown. Dense urban environment with tight corridors, hidden caches, and unpredictable ARC activity.',
    risk: 'Medium',
    image: '/images/ARC Raiders Maps/buried_city.png',
    mapType: 'standard',
    features: ['Urban Cover', 'Cache Spawns', 'ARC Nests'],
  },
  {
    id: 'spaceport',
    displayName: 'Spaceport',
    subtitle: 'Launch Complex',
    description: 'An abandoned space launch facility bristling with high-tech salvage and ARC presence. High-risk, high-reward with launch tower loot events.',
    risk: 'Extreme',
    image: '/images/ARC Raiders Maps/spaceport.png',
    mapType: 'standard',
    features: ['Launch Tower Loot', 'High-Tech Salvage', 'ARC Patrols'],
  },
  {
    id: 'blue-gate',
    displayName: 'Blue Gate',
    subtitle: 'Frontier Outpost',
    description: 'A remote frontier outpost at the edge of contested territory. Moderate difficulty with a mix of open terrain and fortified positions.',
    risk: 'Medium',
    image: '/images/ARC Raiders Maps/blue_gate.png',
    mapType: 'standard',
    features: ['Open Terrain', 'Fortified Positions', 'Resource Nodes'],
  },
  {
    id: 'stella-montis',
    displayName: 'Stella Montis',
    subtitle: 'Mountain Facility',
    description: 'A multi-level mountain research facility with distinct upper and lower sections. Complex navigation with rewarding loot and frequent Night Raid events.',
    risk: 'High',
    image: null,
    mapType: 'multi-floor',
    floors: [
      { id: 'upper', label: 'Upper Level', image: '/images/ARC Raiders Maps/stella_montis_map_upper_level.png.webp' },
      { id: 'lower', label: 'Lower Level', image: '/images/ARC Raiders Maps/stella_montis_map_lower_level.png.webp' },
    ],
    features: ['Multi-Level', 'Night Raids', 'Research Loot'],
  },
]

export function getMapById(id: string): MapMeta | undefined {
  return MAPS.find(m => m.id === id)
}

export function getMapThumbnail(map: MapMeta): string {
  if (map.image) return map.image
  if (map.floors && map.floors.length > 0) return map.floors[0].image
  return '/images/ARC_Maps.PNG'
}
