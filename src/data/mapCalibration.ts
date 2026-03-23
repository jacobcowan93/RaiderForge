/**
 * mapCalibration.ts
 *
 * Per-map calibration configuration for MetaForge quest marker positions.
 *
 * WHY THIS EXISTS:
 *   MetaForge stores quest positions in a game-world coordinate space.
 *   ARDB tile maps represent individual map zones in pixel space.
 *   Mapping between the two requires knowing the world-space bounding box
 *   of each map zone — which MetaForge does not document.
 *
 *   Current approach: empirical min-max normalisation using the observed
 *   range of live position values across all 40 MetaForge quests.
 *   This is approximate. Actual placement accuracy depends on how closely
 *   the global world bounds match each individual map's zone bounds.
 *
 * HOW TO CALIBRATE A MAP:
 *   1. Find a quest that appears on the target map and has a distinctive
 *      in-game landmark location (e.g., "at the north crane on Dam").
 *   2. Note the MetaForge position: { x, y } from the API.
 *   3. Find where that landmark sits in pixel coordinates on the ARDB tile
 *      (use the Leaflet map + browser devtools or the map.unproject() call).
 *   4. Repeat with 2–3 reference points on the same map.
 *   5. Derive the affine transform: worldOrigin + scale factor per axis.
 *   6. Express as worldBounds: { xMin, xMax, yMin, yMax } and set status: 'verified'.
 *
 * MULTI-MAP QUEST NOTE:
 *   Some quests appear on multiple maps but carry a single MetaForge position.
 *   This means the coordinate system is likely global (not per-map-zone).
 *   Per-map overrides apply the same transform to all quests visible on that map,
 *   which may not be perfectly accurate for quests shared across zones.
 *   Document per-map calibration notes below when this ambiguity matters.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/** World-space bounding box used to normalise MetaForge coordinates → [0,1]. */
export type WorldBounds = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

export type CalibrationStatus =
  | 'uncalibrated'  // No data — markers suppressed or rendered with heavy caveat
  | 'approximate'   // Empirical bounds, not ground-truthed — markers render with warning
  | 'verified'      // Cross-referenced against in-game landmarks — markers trusted

export type MapCalibration = {
  /** How reliable the marker placement is for this map. */
  status: CalibrationStatus
  /**
   * World-space bounds for this map's coordinate space.
   * When absent, GLOBAL_WORLD_BOUNDS is used as fallback.
   * Override this field once in-game calibration data is available.
   */
  worldBounds?: WorldBounds
  /**
   * Human-readable calibration notes.
   * Document what was used to derive worldBounds and what is still unknown.
   */
  notes: string
}

// ── Global fallback bounds ────────────────────────────────────────────────────

/**
 * Empirically-observed MetaForge world-space bounds across all 40 live quests.
 * Verified: 2026-03. Padded ~10% beyond observed extremes.
 *
 * Observed range:  x ∈ [-960, +1509],  y ∈ [+319, +7664]
 * Padded to:       x ∈ [-1100, +1700], y ∈ [0, +8400]
 *
 * Used as the default for any map that does not have a per-map worldBounds override.
 */
export const GLOBAL_WORLD_BOUNDS: WorldBounds = {
  xMin: -1100,
  xMax:  1700,
  yMin:     0,
  yMax:  8400,
}

// ── Per-map calibration entries ───────────────────────────────────────────────
//
// All maps are currently 'approximate'. To upgrade a map:
//   1. Follow the calibration steps in the file header comment.
//   2. Set worldBounds to the derived values.
//   3. Change status to 'verified'.
//   4. Update notes with what reference points were used.

export const MAP_CALIBRATIONS: Record<string, MapCalibration> = {

  'dam-battlegrounds': {
    status: 'approximate',
    // No per-map override — uses GLOBAL_WORLD_BOUNDS
    notes: [
      'Using global empirical world bounds.',
      'Has maxNativeZoom:4 (vs 3 on other maps) — tile coordinate scale differs,',
      'but mfPositionToPixels normalises to [0, mapPixelSize] so the difference',
      'is accounted for by Leaflet\'s unproject() at the correct zoom level.',
      'Calibration target: find a named landmark quest on Dam and cross-reference',
      'its MF position (x,y) against the ardb.app tile map.',
    ].join(' '),
  },

  'burial-city': {
    status: 'approximate',
    notes: [
      'Using global empirical world bounds.',
      'No known calibration reference points yet.',
    ].join(' '),
  },

  'spaceport': {
    status: 'approximate',
    notes: [
      'Using global empirical world bounds.',
      'No known calibration reference points yet.',
    ].join(' '),
  },

  'blue-gate': {
    status: 'approximate',
    notes: [
      'Using global empirical world bounds.',
      'No known calibration reference points yet.',
    ].join(' '),
  },

  'stella-montis': {
    status: 'approximate',
    notes: [
      'Using global empirical world bounds.',
      'Multi-floor map (layers[0]=Upper, layers[1]=Lower).',
      'Both layers share maxNativeZoom:3, so the pixel-to-LatLng transform is',
      'consistent across floor switches.',
      'MetaForge positions are single values (not floor-specific) — markers',
      'appear on both floors at the same pixel location.',
      'No known calibration reference points yet.',
    ].join(' '),
  },
}

// ── Lookup helper ─────────────────────────────────────────────────────────────

/**
 * Return the resolved calibration for a given RaiderForge map ID.
 * Always returns a worldBounds — falls back to GLOBAL_WORLD_BOUNDS if no
 * per-map override is defined.
 */
export function getCalibrationForMap(rfMapId: string): {
  status: CalibrationStatus
  worldBounds: WorldBounds
  notes: string
} {
  const cal = MAP_CALIBRATIONS[rfMapId]
  return {
    status:      cal?.status      ?? 'uncalibrated',
    worldBounds: cal?.worldBounds ?? GLOBAL_WORLD_BOUNDS,
    notes:       cal?.notes       ?? 'No calibration data for this map.',
  }
}
