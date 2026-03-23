'use client'

/**
 * MapTileViewer.tsx
 *
 * Interactive tile-based map viewer using Leaflet with CRS.Simple (non-geographic).
 * Tile data sourced from ardb.app — tile layer configs embedded in /api/quests/{id}.
 *
 * Key technical notes:
 *
 * 1. CRS.Simple coordinate system:
 *    Leaflet's CRS.Simple maps pixel coordinates to a flat x/y space.
 *    Images have y=0 at top (y-down); CRS.Simple has y=0 at bottom (y-up).
 *    We use map.unproject([px, py], zoom) to bridge this — it converts pixel
 *    coordinates at a given zoom level to CRS.Simple lat/lng, handling y-inversion
 *    automatically via Leaflet's internal scale math.
 *
 * 2. ARDB URL axis order:
 *    dam/spaceport use .../tiles/{z}/{y}/{x}.webp (row before column in URL path)
 *    buried-city/blue-gate/stella-montis use .../tiles/{z}/{x}/{y}.webp (column before row)
 *    Leaflet uses string substitution: {z}→zoom, {x}→column, {y}→row.
 *    Both patterns work correctly since Leaflet always substitutes {x} and {y} by name,
 *    not by position — the URL path order is just the CDN's file organisation.
 *
 * 3. Stella Montis multi-floor:
 *    tileConfig.layers[] is indexed to match map.floors[]:
 *      layers[0] = stella-montis-l2 = Upper Level
 *      layers[1] = stella-montis-l1 = Lower Level
 *    The activeLayerIndex prop is driven by the floor switcher in MapImageDisplay.
 *
 * 4. Quest markers:
 *    Markers use MetaForge position coordinates (scaled from ~0–1024 to pixel space)
 *    converted to Leaflet LatLng via map.unproject().
 *    Managed in a layerGroup (markerLayerRef) — cleared and re-populated when
 *    the quests prop changes (trader filter toggle).
 *    Only quests with non-null positions get a marker.
 *
 * 5. Graceful fallback:
 *    If 4+ tiles fail to load (CDN unreachable, tile missing, CORS), onFallback()
 *    is called and MapImageDisplay renders the static image instead.
 *
 * 6. SSR safety:
 *    Leaflet requires window/document. Both the L import and tile layer creation
 *    happen inside useEffect (browser-only). The module-level import at the top
 *    is only the TypeScript type — no runtime Leaflet code executes on the server.
 */

import { useEffect, useRef } from 'react'
import type { MapTileConfig } from '../data/maps'
import type { MergedQuest } from '../types/quests'
import { mfPositionToPixels } from '../lib/quests/questUtils'
import { getCalibrationForMap, type WorldBounds } from '../data/mapCalibration'

// ── Trader accent colors for map markers ──────────────────────────────────────
// traderId values come from ardb.trader.id.toLowerCase() — ARDB uses underscores,
// not spaces: "tian_wen", not "tian wen". Keep keys here in sync with ARDB's IDs.
const TRADER_COLORS: Record<string, string> = {
  apollo:    '#38bdf8',  // sky-400
  celeste:   '#22c55e',  // green-500
  lance:     '#f97316',  // orange-500
  shani:     '#a855f7',  // purple-500
  tian_wen:  '#facc15',  // yellow-400
}

// ── Prop types ────────────────────────────────────────────────────────────────

interface Props {
  tileConfig: MapTileConfig
  /** Index into tileConfig.layers — drives floor switching for Stella Montis. */
  activeLayerIndex: number
  /** Called when tile loading fails; triggers static image fallback in parent. */
  onFallback: () => void
  /**
   * Quests to render as markers on the map.
   * Only quests with non-null MetaForge position get a marker.
   * Changes when the trader filter toggles — re-renders marker layer.
   */
  quests: MergedQuest[]
  /**
   * RaiderForge map ID (e.g. "dam-battlegrounds").
   * Used to look up per-map calibration in mapCalibration.ts.
   */
  rfMapId: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MapTileViewer({ tileConfig, activeLayerIndex, onFallback, quests, rfMapId }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<any>(null)
  const layerRef      = useRef<any>(null)
  /** Cached Leaflet instance — available after async init, needed for marker updates */
  const LRef          = useRef<any>(null)
  /** LayerGroup holding all quest markers — cleared + repopulated on filter change */
  const markerLayerRef = useRef<any>(null)

  // --- Initialise Leaflet map on mount ---
  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    let map: any = null

    ;(async () => {
      try {
        // Dynamic import: Leaflet accesses window/document at module level
        const L = (await import('leaflet')).default

        if (cancelled || !containerRef.current || mapRef.current) return

        const activeLayer = tileConfig.layers[activeLayerIndex] ?? tileConfig.layers[0]
        const { tileUrl, maxNativeZoom } = activeLayer
        const { tileSize, mapPixelSize, maxZoom, minZoom } = tileConfig

        map = L.map(containerRef.current, {
          crs: L.CRS.Simple,
          maxZoom,
          minZoom,
          zoomControl: true,
          // Attribution is shown in the RaiderForge footer ("Data provided by ardb.app")
          attributionControl: false,
          // Prevent panning beyond map edges
          maxBoundsViscosity: 1.0,
        })

        // --- Bounds setup ---
        // map.unproject([px_x, px_y], zoom) converts pixel coordinates at a specific zoom
        // level into CRS.Simple coordinates. Using the image's pixel dimensions at
        // maxNativeZoom as our reference, this correctly places the tile layer on the canvas.
        //
        // sw = bottom-left pixel [0, mapPixelSize]  → image bottom-left corner
        // ne = top-right pixel   [mapPixelSize, 0]  → image top-right corner
        const sw = map.unproject([0, mapPixelSize], maxNativeZoom)
        const ne = map.unproject([mapPixelSize, 0], maxNativeZoom)
        const bounds = L.latLngBounds(sw, ne)

        map.fitBounds(bounds)
        map.setMaxBounds(bounds)

        const tileLayer = createTileLayer(L, tileUrl, tileSize, maxNativeZoom, maxZoom, minZoom, bounds)

        // Graceful fallback: accumulate tile errors; if 4+ fail, the CDN or
        // tile set is unavailable and we surface the static image instead.
        let tileErrorCount = 0
        tileLayer.on('tileerror', () => {
          tileErrorCount++
          if (tileErrorCount >= 4 && !cancelled) onFallback()
        })

        tileLayer.addTo(map)
        mapRef.current = map
        layerRef.current = tileLayer
        LRef.current = L

        // Render quest markers with the initial quests prop + per-map calibration
        const { worldBounds } = getCalibrationForMap(rfMapId)
        renderQuestMarkers(L, map, markerLayerRef, quests, tileConfig, worldBounds)

      } catch {
        if (!cancelled) onFallback()
      }
    })()

    return () => {
      cancelled = true
      if (map) {
        map.remove()
        map = null
      }
      mapRef.current    = null
      layerRef.current  = null
      LRef.current      = null
      markerLayerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — intentionally run once

  // --- Handle floor switching (Stella Montis) ---
  // Swaps the active tile layer when activeLayerIndex changes.
  // Markers are on a separate layerGroup and survive the tile layer swap.
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return

    const newLayerDef = tileConfig.layers[activeLayerIndex]
    if (!newLayerDef) return

    ;(async () => {
      const L = (await import('leaflet')).default
      const { tileUrl, maxNativeZoom } = newLayerDef
      const { tileSize, mapPixelSize, maxZoom, minZoom } = tileConfig

      // Recalculate bounds for the new layer (maxNativeZoom may differ between layers)
      const sw = mapRef.current.unproject([0, mapPixelSize], maxNativeZoom)
      const ne = mapRef.current.unproject([mapPixelSize, 0], maxNativeZoom)
      const bounds = L.latLngBounds(sw, ne)

      // Remove old layer, add new one
      layerRef.current.remove()
      const newLayer = createTileLayer(L, tileUrl, tileSize, maxNativeZoom, maxZoom, minZoom, bounds)
      newLayer.addTo(mapRef.current)
      layerRef.current = newLayer
    })()
  }, [activeLayerIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Re-render quest markers when trader filter changes ---
  // quests prop is filtered in MapImageDisplay before being passed here.
  // This effect fires whenever the filtered set changes.
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return
    const { worldBounds } = getCalibrationForMap(rfMapId)
    renderQuestMarkers(LRef.current, mapRef.current, markerLayerRef, quests, tileConfig, worldBounds)
  }, [quests]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    // Explicit pixel height is required — Leaflet needs a non-zero container height to initialise.
    // 520px matches the max-h-[520px] used by the static image fallback in MapImageDisplay.
    <div
      ref={containerRef}
      className="w-full"
      style={{ height: '520px' }}
    />
  )
}

// ── Tile layer factory ────────────────────────────────────────────────────────

/**
 * Builds a Leaflet TileLayer with shared options.
 * Extracted to avoid duplication between init and floor-switch code paths.
 */
function createTileLayer(
  L: any,
  tileUrl: string,
  tileSize: number,
  maxNativeZoom: number,
  maxZoom: number,
  minZoom: number,
  bounds: any,
) {
  return L.tileLayer(tileUrl, {
    tileSize,
    maxNativeZoom, // Leaflet upscales above this zoom level
    maxZoom,
    minZoom,
    noWrap: true,
    bounds,
    // errorTileUrl intentionally omitted — we count errors and trigger onFallback() instead
  })
}

// ── Quest marker rendering ────────────────────────────────────────────────────

/**
 * Clear and re-populate the marker layer group with the given quests.
 *
 * Uses MetaForge position coordinates → mfPositionToPixels(worldBounds) → map.unproject()
 * to place markers at the correct CRS.Simple LatLng positions.
 *
 * worldBounds comes from getCalibrationForMap() in mapCalibration.ts.
 * Quests with null positions are silently skipped (majority of ARDB-only quests).
 */
function renderQuestMarkers(
  L: any,
  map: any,
  markerLayerRef: React.MutableRefObject<any>,
  quests: MergedQuest[],
  tileConfig: MapTileConfig,
  worldBounds: WorldBounds,
) {
  // Create the layer group on first call; clear it on subsequent calls
  if (!markerLayerRef.current) {
    markerLayerRef.current = L.layerGroup().addTo(map)
  } else {
    markerLayerRef.current.clearLayers()
  }

  // Use layers[0].maxNativeZoom as the reference zoom for coord transform.
  // Quest positions are in a single 2D plane — not floor-specific.
  const maxNativeZoom = tileConfig.layers[0].maxNativeZoom

  for (const quest of quests) {
    if (!quest.position) continue

    const pixels = mfPositionToPixels(quest.position, tileConfig, worldBounds)
    if (!pixels) continue

    const latlng = map.unproject(pixels, maxNativeZoom)
    const color  = TRADER_COLORS[quest.traderId] ?? '#9ca3af'

    const icon = L.divIcon({
      className: '',
      html: buildMarkerHtml(color),
      iconSize:    [16, 16],
      iconAnchor:  [8, 8],
      popupAnchor: [0, -12],
    })

    L.marker(latlng, { icon })
      .bindPopup(buildPopupHtml(quest), {
        maxWidth: 240,
        className: 'rf-map-popup',
      })
      .addTo(markerLayerRef.current)
  }
}

/** Circular glow dot in the trader's accent color. */
function buildMarkerHtml(color: string): string {
  return `<div style="
    width:12px;
    height:12px;
    background:${color};
    border:2px solid rgba(255,255,255,0.45);
    border-radius:50%;
    box-shadow:0 0 8px ${color}90, 0 0 3px rgba(0,0,0,0.7);
    cursor:pointer;
  "></div>`
}

/** Dark-themed popup HTML for a quest marker. */
function buildPopupHtml(quest: MergedQuest): string {
  const visibleSteps = quest.steps.slice(0, 4)
  const extraSteps   = quest.steps.length - visibleSteps.length

  const stepRows = visibleSteps
    .map(
      s => `<div style="display:flex;align-items:flex-start;gap:5px;font-size:11px;
                        padding:3px 0;border-top:1px solid rgba(255,255,255,0.06)">
              <span style="opacity:0.35;flex-shrink:0;margin-top:1px">›</span>
              <span style="line-height:1.4">${s.title}${s.amount ? ` ×${s.amount}` : ''}</span>
            </div>`,
    )
    .join('')

  const requiredRow = quest.requiredItems.length > 0
    ? `<div style="margin-top:6px;padding-top:5px;border-top:1px solid rgba(255,255,255,0.08);
                   font-size:10px;opacity:0.4">
         ${quest.requiredItems.length} required item${quest.requiredItems.length !== 1 ? 's' : ''}
       </div>`
    : ''

  const moreRow = extraSteps > 0
    ? `<div style="font-size:10px;opacity:0.3;margin-top:3px">+${extraSteps} more steps</div>`
    : ''

  return `
    <div style="min-width:180px;font-family:inherit">
      <div style="font-weight:700;font-size:13px;line-height:1.3;margin-bottom:2px">
        ${quest.name}
      </div>
      <div style="font-size:11px;opacity:0.5;margin-bottom:7px">${quest.traderName}</div>
      ${stepRows}
      ${moreRow}
      ${requiredRow}
    </div>
  `
}
