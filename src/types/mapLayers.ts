/**
 * mapLayers.ts — Layer model for the RaiderForge interactive map system.
 *
 * Defines the layer types, container subtypes, and associated metadata
 * that power layer visibility filtering in MapImageDisplay + MapQuestFilter.
 *
 * Architecture note:
 *   Container markers are defined here but carry no positional data until
 *   real in-game coordinates are sourced. The rendering pipeline in
 *   MapTileViewer accepts ContainerMarker[] and renders nothing when the
 *   array is empty — no fabricated positions are used.
 *
 * Adding a new layer type:
 *   1. Add to MapLayerType union
 *   2. Add a MapLayerDef entry in MAP_LAYER_DEFS
 *   3. Add the corresponding marker type + metadata in this file
 *   4. Add a render function in MapTileViewer
 *   5. Add layer state gating in MapImageDisplay
 */

// ── Layer types ───────────────────────────────────────────────────────────────

/** All supported overlay layer types on the interactive map. */
export type MapLayerType = 'quests' | 'containers'

// ── Container types ───────────────────────────────────────────────────────────

/** Curated container subtypes that appear in ARC Raiders. */
export type ContainerType =
  | 'locked_case'
  | 'storage_chest'
  | 'weapon_crate'
  | 'safe'
  | 'duffle_bag'
  | 'backpack'

export type ContainerTypeMeta = {
  label: string
  /** CSS hex color used for the marker and filter UI accent. */
  color: string
}

/** Visual and label metadata for each container type. */
export const CONTAINER_TYPE_META: Record<ContainerType, ContainerTypeMeta> = {
  locked_case:   { label: 'Locked Case',   color: '#facc15' },
  storage_chest: { label: 'Storage Chest', color: '#94a3b8' },
  weapon_crate:  { label: 'Weapon Crate',  color: '#f97316' },
  safe:          { label: 'Safe',          color: '#38bdf8' },
  duffle_bag:    { label: 'Duffle Bag',    color: '#a855f7' },
  backpack:      { label: 'Backpack',      color: '#22c55e' },
}

// ── Container marker ──────────────────────────────────────────────────────────

/**
 * A single positioned container spawn on a map.
 *
 * The position field uses the same MetaForge world-space coordinate system
 * as MfQuestRaw positions. mfPositionToPixels() in questUtils.ts converts
 * these to Leaflet pixel coordinates.
 *
 * This type is intentionally unpopulated until verified in-game coordinates
 * are available. Passing an empty ContainerMarker[] to MapTileViewer renders
 * no markers — the pipeline is real-data-first.
 */
export type ContainerMarker = {
  id:            string
  containerType: ContainerType
  /** MetaForge world-space position — same coordinate system as MfQuestRaw positions. */
  position:      { x: number; y: number }
  /** Optional display label, e.g. room name or landmark reference. */
  label?:        string
}

// ── Layer definitions ─────────────────────────────────────────────────────────

export type MapLayerDef = {
  type:     MapLayerType
  label:    string
  /**
   * SVG path data for a 24×24 viewBox stroke icon (Heroicons outline style).
   * Used by MapQuestFilter to render layer toggle buttons.
   */
  iconPath: string
}

/**
 * Ordered layer definitions — rendering order and filter UI order follow this array.
 * Add new layer types here when new data sources become available.
 */
export const MAP_LAYER_DEFS: readonly MapLayerDef[] = [
  {
    type:  'quests',
    label: 'Quests',
    iconPath:
      'M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z',
  },
  {
    type:  'containers',
    label: 'Containers',
    iconPath:
      'M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z',
  },
]
