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
 * 4. Graceful fallback:
 *    If 4+ tiles fail to load (CDN unreachable, tile missing, CORS), onFallback()
 *    is called and MapImageDisplay renders the static image instead.
 *
 * 5. SSR safety:
 *    Leaflet requires window/document. Both the L import and tile layer creation
 *    happen inside useEffect (browser-only). The module-level import at the top
 *    is only the TypeScript type — no runtime Leaflet code executes on the server.
 */

import { useEffect, useRef } from 'react'
import type { MapTileConfig } from '../data/maps'

interface Props {
  tileConfig: MapTileConfig
  /** Index into tileConfig.layers — drives floor switching for Stella Montis. */
  activeLayerIndex: number
  /** Called when tile loading fails; triggers static image fallback in parent. */
  onFallback: () => void
}

export default function MapTileViewer({ tileConfig, activeLayerIndex, onFallback }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const layerRef = useRef<any>(null)

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
      mapRef.current = null
      layerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — intentionally run once

  // --- Handle floor switching (Stella Montis) ---
  // Swaps the active tile layer when activeLayerIndex changes.
  // This is safe because we guard on mapRef.current being initialised.
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
