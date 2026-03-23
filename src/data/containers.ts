/**
 * containers.ts — Curated container spawn data for RaiderForge maps.
 *
 * Coordinate system:
 *   All entries use normalized: true — position.x and position.y are [0, 1]
 *   fractions of the tile image measured from the top-left corner.
 *   This avoids MetaForge world-space dependency for manually placed markers.
 *
 *   x = 0.0 → left edge,  x = 1.0 → right edge
 *   y = 0.0 → top edge,   y = 1.0 → bottom edge
 *
 * Data quality:
 *   Positions are approximate — placed from map reference images and
 *   in-game knowledge. Mark a container with a note comment when its
 *   position has been cross-referenced in-game.
 *
 * Adding a new map:
 *   1. Add a named const (e.g. SPACEPORT_CONTAINERS) with ContainerMarker[]
 *   2. Register it in CONTAINERS_BY_MAP using the RaiderForge map ID
 *      (same IDs as used in src/data/maps.ts and the [mapId] route param)
 *
 * Container types available:
 *   raider_cache | weapon_case | medical_bag
 *   locked_case  | weapon_crate | storage_chest | safe | duffle_bag | backpack
 */

import type { ContainerMarker } from '../types/mapLayers'

// ── Dam Battlegrounds ─────────────────────────────────────────────────────────

const DAM_CONTAINERS: ContainerMarker[] = [
  // ── Raider Caches (red) — enemy stash locations ───────────────────────────
  {
    id:            'dam-rc-01',
    containerType: 'raider_cache',
    normalized:    true,
    position:      { x: 0.14, y: 0.13 },
    label:         'Northwest Bunker',
  },
  {
    id:            'dam-rc-02',
    containerType: 'raider_cache',
    normalized:    true,
    position:      { x: 0.84, y: 0.21 },
    label:         'East Ridge Cache',
  },
  {
    id:            'dam-rc-03',
    containerType: 'raider_cache',
    normalized:    true,
    position:      { x: 0.36, y: 0.54 },
    label:         'Powerhouse Interior',
  },
  {
    id:            'dam-rc-04',
    containerType: 'raider_cache',
    normalized:    true,
    position:      { x: 0.22, y: 0.76 },
    label:         'River Camp',
  },
  {
    id:            'dam-rc-05',
    containerType: 'raider_cache',
    normalized:    true,
    position:      { x: 0.70, y: 0.87 },
    label:         'South Forest Cache',
  },

  // ── Weapon Cases (orange) — tactical positions ────────────────────────────
  {
    id:            'dam-wc-01',
    containerType: 'weapon_case',
    normalized:    true,
    position:      { x: 0.50, y: 0.09 },
    label:         'Dam Gate Post',
  },
  {
    id:            'dam-wc-02',
    containerType: 'weapon_case',
    normalized:    true,
    position:      { x: 0.74, y: 0.41 },
    label:         'East Watchtower',
  },
  {
    id:            'dam-wc-03',
    containerType: 'weapon_case',
    normalized:    true,
    position:      { x: 0.18, y: 0.47 },
    label:         'Maintenance Wing',
  },
  {
    id:            'dam-wc-04',
    containerType: 'weapon_case',
    normalized:    true,
    position:      { x: 0.62, y: 0.27 },
    label:         'Spillway Control',
  },
  {
    id:            'dam-wc-05',
    containerType: 'weapon_case',
    normalized:    true,
    position:      { x: 0.55, y: 0.71 },
    label:         'Flood Control Room',
  },

  // ── Medical Bags (green) — shelter / cover positions ──────────────────────
  {
    id:            'dam-mb-01',
    containerType: 'medical_bag',
    normalized:    true,
    position:      { x: 0.08, y: 0.32 },
    label:         'West Cliff Overhang',
  },
  {
    id:            'dam-mb-02',
    containerType: 'medical_bag',
    normalized:    true,
    position:      { x: 0.47, y: 0.34 },
    label:         'Dam Catwalk',
  },
  {
    id:            'dam-mb-03',
    containerType: 'medical_bag',
    normalized:    true,
    position:      { x: 0.91, y: 0.60 },
    label:         'East Shore Shelter',
  },
  {
    id:            'dam-mb-04',
    containerType: 'medical_bag',
    normalized:    true,
    position:      { x: 0.10, y: 0.64 },
    label:         'Underground Passage',
  },
]

// ── Map registry ──────────────────────────────────────────────────────────────
// Keys must match the RaiderForge map ID used in src/data/maps.ts
// and the [mapId] URL parameter.

export const CONTAINERS_BY_MAP: Record<string, ContainerMarker[]> = {
  'dam-battlegrounds': DAM_CONTAINERS,
}
