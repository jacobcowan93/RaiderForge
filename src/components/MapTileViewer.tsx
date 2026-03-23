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
 *    y=0 is top in image space; y=0 is bottom in CRS.Simple.
 *    map.unproject([px, py], zoom) handles the inversion automatically.
 *
 * 2. ARDB URL axis order:
 *    dam/spaceport: .../tiles/{z}/{y}/{x}.webp  (row, col)
 *    others:        .../tiles/{z}/{x}/{y}.webp  (col, row)
 *    Both work: Leaflet substitutes {x} and {y} by name, not position.
 *
 * 3. Quest markers:
 *    Rendered as Leaflet divIcon dots. Clicking a marker calls onQuestSelect(quest)
 *    which opens QuestDetailPanel in the parent. Clicking the map background calls
 *    onQuestSelect(null) to close the panel.
 *    L.DomEvent.stopPropagation prevents marker clicks from bubbling to the map.
 *    Hover shows a Leaflet tooltip with the quest name.
 *
 * 4. Marker re-render:
 *    markerLayerRef holds a Leaflet LayerGroup. When the quests prop changes
 *    (trader filter toggle), the effect clears and repopulates it.
 *    Per-map calibration worldBounds is looked up via getCalibrationForMap(rfMapId).
 *
 * 5. Graceful fallback:
 *    4+ tile errors → onFallback() → parent renders static image.
 *
 * 6. SSR safety:
 *    Leaflet is dynamically imported inside useEffect. No runtime Leaflet code
 *    executes on the server.
 */

import { useEffect, useRef } from 'react'
import type { MapTileConfig } from '../data/maps'
import type { MergedQuest } from '../types/quests'
import { mfPositionToPixels } from '../lib/quests/questUtils'
import { getCalibrationForMap, type WorldBounds } from '../data/mapCalibration'

// ── Trader accent colors ──────────────────────────────────────────────────────
// Keys match ardb.trader.id.toLowerCase() — underscores, not spaces.
const TRADER_COLORS: Record<string, string> = {
  apollo:    '#38bdf8',
  celeste:   '#22c55e',
  lance:     '#f97316',
  shani:     '#a855f7',
  tian_wen:  '#facc15',
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  tileConfig: MapTileConfig
  activeLayerIndex: number
  onFallback: () => void
  quests: MergedQuest[]
  rfMapId: string
  /** Called when a marker is clicked (opens panel) or map background is clicked (null = close). */
  onQuestSelect: (quest: MergedQuest | null) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MapTileViewer({
  tileConfig,
  activeLayerIndex,
  onFallback,
  quests,
  rfMapId,
  onQuestSelect,
}: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const mapRef         = useRef<any>(null)
  const layerRef       = useRef<any>(null)
  const LRef           = useRef<any>(null)
  const markerLayerRef = useRef<any>(null)

  // Keep a stable ref to onQuestSelect so marker click closures always call
  // the latest version without re-creating markers on every render.
  const onQuestSelectRef = useRef(onQuestSelect)
  useEffect(() => { onQuestSelectRef.current = onQuestSelect })

  // --- Initialise Leaflet map on mount ---
  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    let map: any = null

    ;(async () => {
      try {
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
          attributionControl: false,
          maxBoundsViscosity: 1.0,
        })

        const sw = map.unproject([0, mapPixelSize], maxNativeZoom)
        const ne = map.unproject([mapPixelSize, 0], maxNativeZoom)
        const bounds = L.latLngBounds(sw, ne)

        map.fitBounds(bounds)
        map.setMaxBounds(bounds)

        const tileLayer = createTileLayer(L, tileUrl, tileSize, maxNativeZoom, maxZoom, minZoom, bounds)

        let tileErrorCount = 0
        tileLayer.on('tileerror', () => {
          tileErrorCount++
          if (tileErrorCount >= 4 && !cancelled) onFallback()
        })

        tileLayer.addTo(map)
        mapRef.current  = map
        layerRef.current = tileLayer
        LRef.current    = L

        // Clicking the map background closes the quest detail panel
        map.on('click', () => onQuestSelectRef.current(null))

        // Initial marker render
        const { worldBounds } = getCalibrationForMap(rfMapId)
        renderQuestMarkers(L, map, markerLayerRef, quests, tileConfig, worldBounds, onQuestSelectRef)

      } catch {
        if (!cancelled) onFallback()
      }
    })()

    return () => {
      cancelled = true
      if (map) { map.remove(); map = null }
      mapRef.current       = null
      layerRef.current     = null
      LRef.current         = null
      markerLayerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Floor switching (Stella Montis) ---
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return

    const newLayerDef = tileConfig.layers[activeLayerIndex]
    if (!newLayerDef) return

    ;(async () => {
      const L = (await import('leaflet')).default
      const { tileUrl, maxNativeZoom } = newLayerDef
      const { tileSize, mapPixelSize, maxZoom, minZoom } = tileConfig

      const sw = mapRef.current.unproject([0, mapPixelSize], maxNativeZoom)
      const ne = mapRef.current.unproject([mapPixelSize, 0], maxNativeZoom)
      const bounds = L.latLngBounds(sw, ne)

      layerRef.current.remove()
      const newLayer = createTileLayer(L, tileUrl, tileSize, maxNativeZoom, maxZoom, minZoom, bounds)
      newLayer.addTo(mapRef.current)
      layerRef.current = newLayer
    })()
  }, [activeLayerIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Re-render markers when trader filter changes ---
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return
    const { worldBounds } = getCalibrationForMap(rfMapId)
    renderQuestMarkers(LRef.current, mapRef.current, markerLayerRef, quests, tileConfig, worldBounds, onQuestSelectRef)
  }, [quests]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height: '520px' }}
    />
  )
}

// ── Tile layer factory ────────────────────────────────────────────────────────

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
    maxNativeZoom,
    maxZoom,
    minZoom,
    noWrap: true,
    bounds,
  })
}

// ── Quest marker rendering ────────────────────────────────────────────────────

/**
 * Clear + repopulate the marker LayerGroup.
 *
 * Each marker:
 *   - divIcon: colored dot in trader accent color
 *   - hover tooltip: quest name
 *   - click: calls onQuestSelectRef.current(quest)
 *             + L.DomEvent.stopPropagation to prevent map click from firing
 */
function renderQuestMarkers(
  L: any,
  map: any,
  markerLayerRef: React.MutableRefObject<any>,
  quests: MergedQuest[],
  tileConfig: MapTileConfig,
  worldBounds: WorldBounds,
  onQuestSelectRef: React.MutableRefObject<(quest: MergedQuest | null) => void>,
) {
  if (!markerLayerRef.current) {
    markerLayerRef.current = L.layerGroup().addTo(map)
  } else {
    markerLayerRef.current.clearLayers()
  }

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
      iconSize:    [14, 14],
      iconAnchor:  [7, 7],
      tooltipAnchor: [8, 0],
    })

    const marker = L.marker(latlng, { icon })

    // Hover: show quest name
    marker.bindTooltip(quest.name, {
      direction:   'right',
      offset:      [6, 0],
      opacity:     0.9,
      className:   'rf-map-tooltip',
    })

    // Click: open detail panel, stop event from reaching map background handler
    marker.on('click', (e: any) => {
      L.DomEvent.stopPropagation(e)
      onQuestSelectRef.current(quest)
    })

    markerLayerRef.current.addLayer(marker)
  }
}

function buildMarkerHtml(color: string): string {
  return `<div style="
    width:12px;
    height:12px;
    background:${color};
    border:2px solid rgba(255,255,255,0.50);
    border-radius:50%;
    box-shadow:0 0 7px ${color}85, 0 1px 3px rgba(0,0,0,0.65);
    cursor:pointer;
    transition:transform 0.1s;
  " onmouseenter="this.style.transform='scale(1.4)'" onmouseleave="this.style.transform='scale(1)'"></div>`
}
