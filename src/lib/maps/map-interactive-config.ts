/**
 * map-interactive-config.ts
 *
 * Per-map difficulty modes and POI category group definitions for the
 * NativeMapExplorer interactive shell.
 *
 * Adding a new map's difficulty list:
 *   1. Add an entry to MAP_DIFFICULTIES keyed by the RaiderForge map ID.
 *   2. Add a TCNO attribution URL to TCNO_MAP_URLS.
 *
 * This file is imported by NativeMapExplorer (client component).
 */

import type { Difficulty, PoiCategory } from './poi-types'

// ── Difficulty definitions ─────────────────────────────────────────────────────

export type MapDifficulty = {
    id: Difficulty
    label: string
    /** Accent color shown on the active tab chip. CSS hex. */
    color?: string
}

/** Fallback difficulty list for maps without a custom entry. */
const DEFAULT_DIFFICULTIES: MapDifficulty[] = [
    { id: 'Normal',  label: 'Normal' },
    { id: 'Night',   label: 'Night',  color: '#60a5fa' },
    { id: 'Storm',   label: 'Storm',  color: '#f97316' },
]

export const MAP_DIFFICULTIES: Record<string, MapDifficulty[]> = {
    'dam-battlegrounds': [
        { id: 'Normal',            label: 'Normal' },
        { id: 'Night',             label: 'Night',   color: '#60a5fa' },
        { id: 'Storm',             label: 'Storm',   color: '#f97316' },
        { id: 'Lush Blooms',       label: 'Lush',    color: '#4ade80' },
        { id: 'Uncovered Caches',  label: 'Caches',  color: '#fbbf24' },
        { id: 'Cold Snap',         label: 'Cold',    color: '#a5f3fc' },
        { id: 'Hurricane',         label: 'Hurricane', color: '#c084fc' },
    ],
    'burial-city': [
        { id: 'Normal',            label: 'Normal' },
        { id: 'Night',             label: 'Night',   color: '#60a5fa' },
        { id: 'Storm',             label: 'Storm',   color: '#f97316' },
        { id: 'Lush Blooms',       label: 'Lush',    color: '#4ade80' },
        { id: 'Uncovered Caches',  label: 'Caches',  color: '#fbbf24' },
        { id: 'Cold Snap',         label: 'Cold',    color: '#a5f3fc' },
        { id: 'Bird City',         label: 'Birds',   color: '#facc15' },
        { id: 'Hurricane',         label: 'Hurricane', color: '#c084fc' },
    ],
    spaceport: [
        { id: 'Normal',            label: 'Normal' },
        { id: 'Night',             label: 'Night',   color: '#60a5fa' },
        { id: 'Storm',             label: 'Storm',   color: '#f97316' },
        { id: 'Lush Blooms',       label: 'Lush',    color: '#4ade80' },
        { id: 'Uncovered Caches',  label: 'Caches',  color: '#fbbf24' },
        { id: 'Cold Snap',         label: 'Cold',    color: '#a5f3fc' },
        { id: 'Hurricane',         label: 'Hurricane', color: '#c084fc' },
        { id: 'Tower Loot',        label: 'Tower',   color: '#fb923c' },
    ],
    'blue-gate': [
        { id: 'Normal',            label: 'Normal' },
        { id: 'Night',             label: 'Night',   color: '#60a5fa' },
        { id: 'Storm',             label: 'Storm',   color: '#f97316' },
        { id: 'Lush Blooms',       label: 'Lush',    color: '#4ade80' },
        { id: 'Uncovered Caches',  label: 'Caches',  color: '#fbbf24' },
        { id: 'Cold Snap',         label: 'Cold',    color: '#a5f3fc' },
        { id: 'Hurricane',         label: 'Hurricane', color: '#c084fc' },
    ],
    'stella-montis': [
        { id: 'Normal',  label: 'Normal' },
        { id: 'Night',   label: 'Night',  color: '#60a5fa' },
    ],
}

export function getDifficultiesForMap(mapId: string): MapDifficulty[] {
    return MAP_DIFFICULTIES[mapId] ?? DEFAULT_DIFFICULTIES
}

// ── Category groups ────────────────────────────────────────────────────────────

export type CategoryGroupDef = {
    id: string
    label: string
    categories: PoiCategory[]
}

/**
 * Ordered category groups shown in the NativeMapExplorer layer panel.
 * Mirrors TCNO's grouping (Locations, Loot, World) in RaiderForge terms.
 */
export const CATEGORY_GROUPS: CategoryGroupDef[] = [
    {
        id:         'locations',
        label:      'Locations',
        categories: ['extract', 'key', 'quest', 'area'],
    },
    {
        id:         'loot',
        label:      'Loot',
        categories: ['container', 'loot'],
    },
    {
        id:         'world',
        label:      'World',
        categories: ['arc', 'nature', 'interaction', 'noise'],
    },
]

/** Default-on POI categories when the explorer first loads. */
export const DEFAULT_ACTIVE_CATEGORIES: ReadonlySet<PoiCategory> = new Set<PoiCategory>([
    'extract',
    'key',
    'quest',
    'area',
])

// ── TCNO attribution URLs ──────────────────────────────────────────────────────

const TCNO_URLS: Record<string, string> = {
    'dam-battlegrounds': 'https://maps.tcno.co/arc/dam',
    'burial-city':       'https://maps.tcno.co/arc/buried',
    spaceport:           'https://maps.tcno.co/arc/spaceport',
    'blue-gate':         'https://maps.tcno.co/arc/bluegate',
    'stella-montis':     'https://maps.tcno.co/arc/stella',
}

export function getTcnoUrl(mapId: string): string {
    return TCNO_URLS[mapId] ?? 'https://maps.tcno.co'
}
