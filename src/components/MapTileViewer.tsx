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
 *    All map quests are rendered. Active-trader quests render at full opacity;
 *    inactive-trader quests render dimmed (opacity 0.22, no click handler).
 *    The selected quest marker scales up and shows a bright ring.
 *    Clicking a marker calls onQuestSelect(quest). Clicking the map background
 *    calls onQuestSelect(null) to close the panel.
 *    Hover shows a Leaflet tooltip with the quest name.
 *
 * 4. Container markers:
 *    Rendered as diamond-shaped (rotated-square) divIcons, color-coded by
 *    container type via CONTAINER_TYPE_META. Accepts ContainerMarker[] — when
 *    the array is empty, the container layer renders nothing. No fake data.
 *    Hover shows a Leaflet tooltip with the container label and type name.
 *    Clicking a container calls onContainerSelect(container); clicking the
 *    selected container again deselects it. Map background click deselects all.
 *
 * 5. Marker re-render:
 *    markerLayerRef (quests) and containerLayerRef each hold a Leaflet LayerGroup.
 *    Quest effect re-runs on [quests, selectedQuestName].
 *    Container effect re-runs on [containers, selectedContainerId].
 *    Per-map calibration worldBounds is looked up via getCalibrationForMap(rfMapId).
 *
 * 6. Graceful fallback:
 *    4+ tile errors → onFallback() → parent renders static image.
 *
 * 7. SSR safety:
 *    Leaflet is dynamically imported inside useEffect. No runtime Leaflet code
 *    executes on the server.
 *
 * 8. Tactical tint:
 *    A 25% black overlay is injected into mapPane (z-index 350) so it sits above
 *    tiles (~200) but below markers/tooltips (~600+). pointer-events: none.
 */

import { useEffect, useRef } from 'react'
import type { MapTileConfig } from '../data/maps'
import type { MergedQuest } from '../types/quests'
import type { ContainerMarker, LootAreaMarker } from '../types/mapLayers'
import { CONTAINER_TYPE_META, LOOT_AREA_TIER_META } from '../types/mapLayers'
import type { MapPoi } from '@/lib/maps/poi-types'
import { buildPoiMarkerHtml, POI_CATEGORY_META } from '@/components/maps/MapPoiMarker'
import type { PoiPlacementSample } from '@/components/maps/MapPoiLayer'
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
  /** Active-trader quests (filtered). Used as dep to trigger quest marker re-render. */
  quests: MergedQuest[]
  /** All quests for the map — inactive-trader quests render dimmed. */
  allQuests: MergedQuest[]
  /** Name of the currently selected quest, or null. Drives selected-marker highlight. */
  selectedQuestName: string | null
  rfMapId: string
  /** Called when a marker is clicked (opens panel) or map background is clicked (null = close). */
  onQuestSelect: (quest: MergedQuest | null) => void
  /**
   * Container markers to render on the map.
   * Empty array = no container markers rendered (no data yet).
   * Gated by parent (MapImageDisplay) based on activeLayers state.
   */
  containers?: ContainerMarker[]
  /** ID of the currently selected container, or null. Drives selected-marker highlight. */
  selectedContainerId?: string | null
  /** Called when a container marker is clicked or map background deselects. */
  onContainerSelect?: (container: ContainerMarker | null) => void
  /**
   * Loot area markers sourced from MetaForge /api/game-map-data.
   * Empty array = no loot area markers (API unavailable or map has no zones).
   * Gated by parent (MapImageDisplay) based on activeLayers state.
   */
  lootAreas?: LootAreaMarker[]
  /** ID of the currently selected loot area, or null. */
  selectedLootAreaId?: string | null
  /** Called when a loot area marker is clicked or map background deselects. */
  onLootAreaSelect?: (area: LootAreaMarker | null) => void
  /** Fixed CSS height when not filling parent (e.g. min(72vh, 720px)). */
  mapHeight?: string
  /** When true, map stretches to fill a flex parent (fullscreen shell). */
  fillContainer?: boolean
  /** Curated Pins layer (percent coordinates on full map image). */
  pois?: MapPoi[]
  selectedPoiId?: string | null
  onPoiSelect?: (poi: MapPoi | null) => void
  /** When true, map clicks emit placement samples instead of clearing selection. */
  poiPlacementMode?: boolean
  onPoiPlacementSample?: (sample: PoiPlacementSample) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MapTileViewer({
  tileConfig,
  activeLayerIndex,
  onFallback,
  quests,
  allQuests,
  selectedQuestName,
  rfMapId,
  onQuestSelect,
  containers = [],
  selectedContainerId = null,
  onContainerSelect,
  lootAreas = [],
  selectedLootAreaId = null,
  onLootAreaSelect,
  mapHeight = 'min(72vh, 720px)',
  fillContainer = false,
  pois = [],
  selectedPoiId = null,
  onPoiSelect,
  poiPlacementMode = false,
  onPoiPlacementSample,
}: Props) {
  const containerRef       = useRef<HTMLDivElement>(null)
  const mapRef             = useRef<any>(null)
  const layerRef           = useRef<any>(null)
  const LRef               = useRef<any>(null)
  const markerLayerRef     = useRef<any>(null)
  const containerLayerRef  = useRef<any>(null)
  const lootAreaLayerRef   = useRef<any>(null)
  const poiLayerRef        = useRef<any>(null)

  const tileConfigRef = useRef(tileConfig)
  tileConfigRef.current = tileConfig
  const activeLayerIndexRef = useRef(activeLayerIndex)
  activeLayerIndexRef.current = activeLayerIndex
  const rfMapIdRef = useRef(rfMapId)
  rfMapIdRef.current = rfMapId
  const poiPlacementModeRef = useRef(poiPlacementMode)
  poiPlacementModeRef.current = poiPlacementMode
  const onPoiPlacementSampleRef = useRef(onPoiPlacementSample)
  onPoiPlacementSampleRef.current = onPoiPlacementSample
  const onPoiSelectRef = useRef(onPoiSelect)
  onPoiSelectRef.current = onPoiSelect

  // Keep stable refs so marker click closures always call latest callbacks
  // without re-creating all markers on every render.
  const onQuestSelectRef = useRef(onQuestSelect)
  useEffect(() => { onQuestSelectRef.current = onQuestSelect })

  const onContainerSelectRef = useRef(onContainerSelect)
  useEffect(() => { onContainerSelectRef.current = onContainerSelect })

  const onLootAreaSelectRef = useRef(onLootAreaSelect)
  useEffect(() => { onLootAreaSelectRef.current = onLootAreaSelect })

  const allQuestsRef = useRef(allQuests)
  useEffect(() => { allQuestsRef.current = allQuests })

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

        // Contrast tint above tiles, below overlay/marker panes (Leaflet: tile ~200, overlay ~400, marker ~600).
        const panes = map.getPanes()
        const tintEl = L.DomUtil.create('div', 'rf-map-tint-overlay', panes.mapPane)
        Object.assign(tintEl.style, {
          position:   'absolute',
          inset:      '0',
          zIndex:     '350',
          background: 'rgba(0,0,0,0.25)',
          pointerEvents: 'none',
        })

        // Clicking the map background closes all selection panels (or samples coords in placement mode)
        map.on('click', (e: any) => {
          if (poiPlacementModeRef.current && onPoiPlacementSampleRef.current) {
            const tc = tileConfigRef.current
            const idx = activeLayerIndexRef.current
            const layerDef = tc.layers[idx] ?? tc.layers[0]
            const z = layerDef.maxNativeZoom
            const pt = map.project(e.latlng, z)
            const w = tc.mapPixelSize
            const x = Math.round(Math.min(100, Math.max(0, (pt.x / w) * 100)) * 100) / 100
            const y = Math.round(Math.min(100, Math.max(0, (pt.y / w) * 100)) * 100) / 100
            onPoiPlacementSampleRef.current({
              mapId: rfMapIdRef.current,
              x,
              y,
              floorIndex: activeLayerIndexRef.current,
            })
            return
          }
          onQuestSelectRef.current(null)
          onContainerSelectRef.current?.(null)
          onLootAreaSelectRef.current?.(null)
          onPoiSelectRef.current?.(null)
        })

        const { worldBounds } = getCalibrationForMap(rfMapId)

        // Initial quest marker render
        renderQuestMarkers(
          L, map, markerLayerRef,
          quests, allQuestsRef.current, selectedQuestName,
          tileConfig, worldBounds, onQuestSelectRef,
        )

        // Initial container marker render (empty until real data is available)
        renderContainerMarkers(
          L, map, containerLayerRef,
          containers, tileConfig, worldBounds,
          selectedContainerId, onContainerSelectRef,
        )

        // Initial loot area marker render (empty until MetaForge API is available)
        renderLootAreaMarkers(
          L, map, lootAreaLayerRef,
          lootAreas, tileConfig, worldBounds,
          selectedLootAreaId, onLootAreaSelectRef,
        )

        renderPoiMarkers(
          L, map, poiLayerRef,
          pois, tileConfig, activeLayerIndex, selectedPoiId, onPoiSelectRef,
        )

      } catch {
        if (!cancelled) onFallback()
      }
    })()

    return () => {
      cancelled = true
      if (map) { map.remove(); map = null }
      mapRef.current            = null
      layerRef.current          = null
      LRef.current              = null
      markerLayerRef.current    = null
      containerLayerRef.current = null
      lootAreaLayerRef.current  = null
      poiLayerRef.current       = null
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

  // --- Re-render quest markers when trader filter or selected quest changes ---
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return
    const { worldBounds } = getCalibrationForMap(rfMapId)
    renderQuestMarkers(
      LRef.current, mapRef.current, markerLayerRef,
      quests, allQuestsRef.current, selectedQuestName,
      tileConfig, worldBounds, onQuestSelectRef,
    )
  }, [quests, selectedQuestName]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Re-render container markers when data or selection changes ---
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return
    const { worldBounds } = getCalibrationForMap(rfMapId)
    renderContainerMarkers(
      LRef.current, mapRef.current, containerLayerRef,
      containers, tileConfig, worldBounds,
      selectedContainerId, onContainerSelectRef,
    )
  }, [containers, selectedContainerId]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Re-render loot area markers when data or selection changes ---
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return
    const { worldBounds } = getCalibrationForMap(rfMapId)
    renderLootAreaMarkers(
      LRef.current, mapRef.current, lootAreaLayerRef,
      lootAreas, tileConfig, worldBounds,
      selectedLootAreaId, onLootAreaSelectRef,
    )
  }, [lootAreas, selectedLootAreaId]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Re-render curated POI markers ---
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return
    renderPoiMarkers(
      LRef.current, mapRef.current, poiLayerRef,
      pois, tileConfig, activeLayerIndex, selectedPoiId, onPoiSelectRef,
    )
  }, [pois, selectedPoiId, activeLayerIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Leaflet needs invalidateSize when the container is resized (e.g. fullscreen).
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.invalidateSize({ animate: false })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={`w-full min-h-0 ${fillContainer ? 'flex-1 h-full' : ''}`}
      style={fillContainer ? { height: '100%', minHeight: 'min(42vh, 420px)' } : { height: mapHeight }}
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
 * Clear + repopulate the quest marker LayerGroup.
 *
 * Rendering tiers:
 *   selected   — 18px, solid white ring, stronger glow
 *   active     — 12px normal dot, hover scale, tooltip
 *   inactive   — 10px dimmed (opacity 0.22), no click, no tooltip
 */
function renderQuestMarkers(
  L: any,
  map: any,
  markerLayerRef: React.MutableRefObject<any>,
  activeQuests: MergedQuest[],
  allQuests: MergedQuest[],
  selectedQuestName: string | null,
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
  const activeNames = new Set(activeQuests.map(q => q.name))

  for (const quest of allQuests) {
    if (!quest.position) continue

    const pixels = mfPositionToPixels(quest.position, tileConfig, worldBounds)
    if (!pixels) continue

    const latlng     = map.unproject(pixels, maxNativeZoom)
    const isActive   = activeNames.has(quest.name)
    const isSelected = quest.name === selectedQuestName
    const color      = TRADER_COLORS[quest.traderId] ?? '#9ca3af'

    if (!isActive) {
      // Dimmed marker — no interaction
      const icon = L.divIcon({
        className: '',
        html:       buildQuestMarkerHtml(color, false, false),
        iconSize:   [12, 12],
        iconAnchor: [6, 6],
      })
      L.marker(latlng, { icon, interactive: false }).addTo(markerLayerRef.current)
      continue
    }

    // Active or selected marker
    const size   = isSelected ? 18 : 12
    const anchor = isSelected ? 9  : 6

    const icon = L.divIcon({
      className:      '',
      html:           buildQuestMarkerHtml(color, true, isSelected),
      iconSize:       [size, size],
      iconAnchor:     [anchor, anchor],
      tooltipAnchor:  [anchor + 2, 0],
    })

    const marker = L.marker(latlng, { icon })

    marker.bindTooltip(quest.name, {
      direction: 'right',
      offset:    [6, 0],
      opacity:   0.9,
      className: 'rf-map-tooltip',
    })

    marker.on('click', (e: any) => {
      L.DomEvent.stopPropagation(e)
      onQuestSelectRef.current(quest)
    })

    markerLayerRef.current.addLayer(marker)
  }
}

function buildQuestMarkerHtml(color: string, active: boolean, selected: boolean): string {
  if (!active) {
    return `<div style="
      width:10px;
      height:10px;
      background:#6b7280;
      border:1.5px solid rgba(255,255,255,0.15);
      border-radius:50%;
      opacity:0.22;
      pointer-events:none;
    "></div>`
  }

  if (selected) {
    return `<div style="
      width:16px;
      height:16px;
      background:${color};
      border:2.5px solid rgba(255,255,255,0.90);
      border-radius:50%;
      box-shadow:0 0 12px ${color}, 0 0 20px ${color}55, 0 1px 4px rgba(0,0,0,0.7);
      cursor:pointer;
    "></div>`
  }

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

// ── Container marker rendering ────────────────────────────────────────────────

/**
 * Clear + repopulate the container marker LayerGroup.
 *
 * Markers are diamond-shaped (rotated square) divIcons, color-coded by
 * container type. When containers[] is empty, the layer renders nothing —
 * no placeholder or fake data is used.
 *
 * Selected container renders with a white ring + stronger glow (16px).
 * Normal containers render at 11px with hover scale effect.
 * Tooltip shows: "Label · Type Name" (or just "Type Name" if no label).
 */
function renderContainerMarkers(
  L: any,
  map: any,
  containerLayerRef: React.MutableRefObject<any>,
  containers: ContainerMarker[],
  tileConfig: MapTileConfig,
  worldBounds: WorldBounds,
  selectedContainerId: string | null,
  onContainerSelectRef: React.MutableRefObject<((c: ContainerMarker | null) => void) | undefined>,
) {
  if (!containerLayerRef.current) {
    containerLayerRef.current = L.layerGroup().addTo(map)
  } else {
    containerLayerRef.current.clearLayers()
  }

  if (containers.length === 0) return

  const maxNativeZoom = tileConfig.layers[0].maxNativeZoom

  for (const container of containers) {
    let pixels: [number, number] | null

    if (container.normalized) {
      // Manually curated [0, 1] tile-fraction → pixel space (top-left origin)
      pixels = [
        container.position.x * tileConfig.mapPixelSize,
        container.position.y * tileConfig.mapPixelSize,
      ]
    } else {
      // MetaForge world-space → pixel space via calibrated bounds
      pixels = mfPositionToPixels(container.position, tileConfig, worldBounds)
    }

    if (!pixels) continue

    const latlng     = map.unproject(pixels, maxNativeZoom)
    const meta       = CONTAINER_TYPE_META[container.containerType]
    const label      = container.label ?? meta.label
    const isSelected = container.id === selectedContainerId

    const markerSize   = isSelected ? 16 : 11
    const markerAnchor = markerSize / 2

    const icon = L.divIcon({
      className:     '',
      html:          buildContainerMarkerHtml(meta.color, isSelected),
      iconSize:      [markerSize, markerSize],
      iconAnchor:    [markerAnchor, markerAnchor],
      tooltipAnchor: [markerAnchor + 4, 0],
    })

    const marker = L.marker(latlng, { icon })

    // Tooltip: "East Ridge Cache · Raider Cache" or just "Raider Cache"
    const tooltipText = container.label
      ? `${container.label} · ${meta.label}`
      : meta.label

    marker.bindTooltip(tooltipText, {
      direction: 'right',
      offset:    [6, 0],
      opacity:   0.9,
      className: 'rf-map-tooltip',
    })

    marker.on('click', (e: any) => {
      L.DomEvent.stopPropagation(e)
      // Toggle: click selected container deselects it
      if (isSelected) {
        onContainerSelectRef.current?.(null)
      } else {
        onContainerSelectRef.current?.(container)
      }
    })

    containerLayerRef.current.addLayer(marker)
  }
}

// ── Loot area marker rendering ─────────────────────────────────────────────────

/**
 * Clear + repopulate the loot area marker LayerGroup.
 *
 * Markers are hollow circles, visually distinct from:
 *   - Quest markers (solid filled circles)
 *   - Container markers (rotated-square diamonds)
 *
 * Tier is communicated via color (LOOT_AREA_TIER_META).
 * Selected loot area renders as solid fill with white ring + stronger glow.
 * Normal loot areas render as hollow circles with hover scale.
 * Tooltip: "Zone Name · Tier Label"
 *
 * Positions use MetaForge world-space coordinates converted via
 * mfPositionToPixels(). When lootAreas[] is empty the layer renders nothing.
 */
function renderLootAreaMarkers(
  L: any,
  map: any,
  lootAreaLayerRef: React.MutableRefObject<any>,
  lootAreas: LootAreaMarker[],
  tileConfig: MapTileConfig,
  worldBounds: WorldBounds,
  selectedLootAreaId: string | null,
  onLootAreaSelectRef: React.MutableRefObject<((a: LootAreaMarker | null) => void) | undefined>,
) {
  if (!lootAreaLayerRef.current) {
    lootAreaLayerRef.current = L.layerGroup().addTo(map)
  } else {
    lootAreaLayerRef.current.clearLayers()
  }

  if (lootAreas.length === 0) return

  const maxNativeZoom = tileConfig.layers[0].maxNativeZoom

  for (const area of lootAreas) {
    const pixels = mfPositionToPixels(area.position, tileConfig, worldBounds)
    if (!pixels) continue

    const latlng     = map.unproject(pixels, maxNativeZoom)
    const meta       = LOOT_AREA_TIER_META[area.tier]
    const isSelected = area.id === selectedLootAreaId

    const markerSize   = isSelected ? 18 : 12
    const markerAnchor = markerSize / 2

    const icon = L.divIcon({
      className:     '',
      html:          buildLootAreaMarkerHtml(meta.color, isSelected),
      iconSize:      [markerSize, markerSize],
      iconAnchor:    [markerAnchor, markerAnchor],
      tooltipAnchor: [markerAnchor + 4, 0],
    })

    const marker = L.marker(latlng, { icon })

    marker.bindTooltip(`${area.name} · ${meta.label}`, {
      direction: 'right',
      offset:    [6, 0],
      opacity:   0.9,
      className: 'rf-map-tooltip',
    })

    marker.on('click', (e: any) => {
      L.DomEvent.stopPropagation(e)
      // Toggle: clicking selected loot area deselects it
      if (isSelected) {
        onLootAreaSelectRef.current?.(null)
      } else {
        onLootAreaSelectRef.current?.(area)
      }
    })

    lootAreaLayerRef.current.addLayer(marker)
  }
}

function buildLootAreaMarkerHtml(color: string, selected: boolean): string {
  if (selected) {
    // Selected: solid fill, white ring, strong glow — mirrors quest selected state
    return `<div style="
      width:16px;
      height:16px;
      background:${color};
      border:2.5px solid rgba(255,255,255,0.90);
      border-radius:50%;
      box-shadow:0 0 12px ${color}, 0 0 20px ${color}55, 0 1px 4px rgba(0,0,0,0.7);
      cursor:pointer;
    "></div>`
  }

  // Normal: hollow circle with color border, hover scale — distinct from solid quest dots
  return `<div style="
    width:12px;
    height:12px;
    background:${color}18;
    border:2px solid ${color};
    border-radius:50%;
    box-shadow:0 0 7px ${color}70, 0 1px 3px rgba(0,0,0,0.65);
    cursor:pointer;
    transition:transform 0.1s;
  " onmouseenter="this.style.transform='scale(1.5)'" onmouseleave="this.style.transform='scale(1)'"></div>`
}

// ── Curated POI markers (percent of full map image, top-left origin) ───────────

function renderPoiMarkers(
  L: any,
  map: any,
  poiLayerRef: React.MutableRefObject<any>,
  pois: MapPoi[],
  tileConfig: MapTileConfig,
  activeLayerIndex: number,
  selectedPoiId: string | null,
  onPoiSelectRef: React.MutableRefObject<((p: MapPoi | null) => void) | undefined>,
) {
  if (!poiLayerRef.current) {
    poiLayerRef.current = L.layerGroup().addTo(map)
  } else {
    poiLayerRef.current.clearLayers()
  }

  if (pois.length === 0) return

  const layerDef = tileConfig.layers[activeLayerIndex] ?? tileConfig.layers[0]
  const maxNativeZoom = layerDef.maxNativeZoom
  const w = tileConfig.mapPixelSize

  for (const poi of pois) {
    const pixels: [number, number] = [(poi.x / 100) * w, (poi.y / 100) * w]
    const latlng = map.unproject(pixels, maxNativeZoom)
    const meta = POI_CATEGORY_META[poi.category]
    const isSelected = poi.id === selectedPoiId

    const markerSize = isSelected ? 15 : 12
    const anchor = markerSize / 2

    const icon = L.divIcon({
      className: '',
      html: buildPoiMarkerHtml(poi.category, isSelected),
      iconSize: [markerSize, markerSize],
      iconAnchor: [anchor, anchor],
      tooltipAnchor: [anchor + 4, 0],
    })

    const marker = L.marker(latlng, { icon })

    marker.bindTooltip(`${poi.name} · ${meta.label}`, {
      direction: 'right',
      offset: [6, 0],
      opacity: 0.9,
      className: 'rf-map-tooltip',
    })

    marker.on('click', (ev: any) => {
      L.DomEvent.stopPropagation(ev)
      if (isSelected) {
        onPoiSelectRef.current?.(null)
      } else {
        onPoiSelectRef.current?.(poi)
      }
    })

    poiLayerRef.current.addLayer(marker)
  }
}

function buildContainerMarkerHtml(color: string, selected: boolean): string {
  if (selected) {
    // Selected: larger, white ring, strong directional glow — mirrors quest selected state
    return `<div style="
      width:14px;
      height:14px;
      background:${color};
      border:2.5px solid rgba(255,255,255,0.90);
      transform:rotate(45deg);
      box-shadow:0 0 12px ${color}, 0 0 22px ${color}55, 0 1px 4px rgba(0,0,0,0.7);
      cursor:pointer;
    "></div>`
  }

  // Normal: diamond with hover scale
  return `<div style="
    width:11px;
    height:11px;
    background:${color};
    border:1.5px solid rgba(255,255,255,0.55);
    transform:rotate(45deg);
    box-shadow:0 0 8px ${color}90, 0 1px 3px rgba(0,0,0,0.65);
    cursor:pointer;
    transition:transform 0.12s ease;
  " onmouseenter="this.style.transform='rotate(45deg) scale(1.55)'" onmouseleave="this.style.transform='rotate(45deg) scale(1)'"></div>`
}
