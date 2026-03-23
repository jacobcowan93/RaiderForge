'use client'

/**
 * MapImageDisplay.tsx
 *
 * Map surface component for /maps/[mapId].
 *
 * Rendering priority:
 *   1. MapTileViewer (Leaflet tiles from ardb.app CDN) — when map.tileConfig is present
 *   2. Static fallback image — when tileConfig is absent OR tile loading fails
 *
 * The fallback ensures continuity for users even if the ARDB tile CDN is unavailable.
 * Floor switching (Stella Montis) drives both the tile layer and the fallback image
 * via the shared activeFloor index.
 */

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { MapMeta } from '../data/maps'

// Dynamic import with SSR disabled: Leaflet uses window/document at runtime.
// next/dynamic with ssr:false ensures MapTileViewer only runs in the browser.
const MapTileViewer = dynamic(() => import('./MapTileViewer'), {
  ssr: false,
  loading: () => <TileLoadingState />,
})

type Props = { map: MapMeta }

export default function MapImageDisplay({ map }: Props) {
  // Shared floor index for both tile layers and static fallback images
  const [activeFloor, setActiveFloor] = useState(0)
  // Set to true when MapTileViewer reports tile errors — triggers static image fallback
  const [tileFallback, setTileFallback] = useState(false)

  const handleTileFallback = useCallback(() => setTileFallback(true), [])

  const hasTiles = !!map.tileConfig && !tileFallback
  const isMultiFloor = map.mapType === 'multi-floor' && Array.isArray(map.floors) && map.floors.length > 0

  // Static fallback image path — tracks active floor for multi-floor maps
  const fallbackSrc = isMultiFloor
    ? (map.floors![activeFloor]?.image ?? '/images/ARC_Maps.PNG')
    : (map.image ?? '/images/ARC_Maps.PNG')

  const fallbackAlt = isMultiFloor
    ? `${map.displayName} — ${map.floors![activeFloor]?.label ?? ''}`
    : map.displayName

  return (
    <div>
      {/* Floor switcher — rendered for multi-floor maps regardless of tile/fallback mode */}
      {isMultiFloor && (
        <div className="flex items-center gap-1 px-4 py-3 border-b border-white/5 bg-black/20">
          <span className="text-[10px] text-white/20 mr-2 uppercase tracking-widest">Floor</span>
          {map.floors!.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setActiveFloor(i)}
              className={`text-xs font-medium rounded-lg px-3 py-1.5 transition-all ${
                activeFloor === i
                  ? 'bg-rf-red/20 text-rf-red border border-rf-red/30 shadow-sm shadow-rf-red/10'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Map surface */}
      <div className="relative bg-black/40">
        {hasTiles ? (
          // Tile viewer: interactive zoom/pan via Leaflet + ardb.app tile CDN
          // activeLayerIndex is aligned with floors[] — same index drives both.
          <MapTileViewer
            tileConfig={map.tileConfig!}
            activeLayerIndex={activeFloor}
            onFallback={handleTileFallback}
          />
        ) : (
          // Static fallback: original map images, maintained until tiles are verified
          <img
            src={fallbackSrc}
            alt={fallbackAlt}
            className="w-full object-contain max-h-[520px]"
          />
        )}

        {/* Phase 1B: quest markers will replace this badge once ardb.app /quests data is wired */}
        <MapStatusBadge hasTiles={hasTiles} tileFallback={tileFallback} />
      </div>
    </div>
  )
}

// --- Sub-components ---

function TileLoadingState() {
  return (
    <div
      className="w-full flex items-center justify-center bg-black/60"
      style={{ height: '520px' }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-[#22c55e]/40 rounded-full animate-pulse" />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-white/20">Loading map tiles</span>
      </div>
    </div>
  )
}

function MapStatusBadge({ hasTiles, tileFallback }: { hasTiles: boolean; tileFallback: boolean }) {
  if (tileFallback) {
    // Tile loading failed — show the reason
    return (
      <div className="absolute bottom-3 right-3">
        <span className="inline-flex items-center gap-1 text-[9px] text-white/20 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 border border-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-2.5 h-2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          Static image — tile CDN unavailable
        </span>
      </div>
    )
  }

  if (hasTiles) {
    // Tile viewer active — markers are the next phase
    return (
      <div className="absolute bottom-3 right-3">
        <span className="inline-flex items-center gap-1 text-[9px] text-white/20 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 border border-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-2.5 h-2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          Quest markers — coming in Phase 1B
        </span>
      </div>
    )
  }

  // No tile config on this map (shouldn't happen with current data, but safe fallback)
  return (
    <div className="absolute bottom-3 right-3">
      <span className="inline-flex items-center gap-1 text-[9px] text-white/20 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 border border-white/5">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-2.5 h-2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
        Markers unavailable
      </span>
    </div>
  )
}
