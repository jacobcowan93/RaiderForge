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
 *
 * Quest markers:
 *   mapQuests (server-fetched, pre-filtered to this map) are passed down to MapTileViewer.
 *   MapQuestFilter renders above the map and drives activeTraders state here.
 *   Only quests from active traders (default: all) are forwarded to MapTileViewer.
 */

import { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { MapMeta } from '../data/maps'
import type { MergedQuest } from '../types/quests'
import { getCalibrationForMap } from '../data/mapCalibration'
import MapQuestFilter from './MapQuestFilter'

// Dynamic import with SSR disabled: Leaflet uses window/document at runtime.
// next/dynamic with ssr:false ensures MapTileViewer only runs in the browser.
const MapTileViewer = dynamic(() => import('./MapTileViewer'), {
  ssr: false,
  loading: () => <TileLoadingState />,
})

interface Props {
  map: MapMeta
  /** Quests for this specific map, merged from MetaForge + ARDB. Empty if fetch failed. */
  mapQuests?: MergedQuest[]
}

export default function MapImageDisplay({ map, mapQuests = [] }: Props) {
  // Shared floor index for both tile layers and static fallback images
  const [activeFloor, setActiveFloor] = useState(0)
  // Set to true when MapTileViewer reports tile errors — triggers static image fallback
  const [tileFallback, setTileFallback] = useState(false)

  // Active trader IDs — initialised with ALL traders from the quest list (= show all)
  const [activeTraders, setActiveTraders] = useState<Set<string>>(
    () => new Set(mapQuests.map(q => q.traderId)),
  )

  const handleTileFallback = useCallback(() => setTileFallback(true), [])

  const toggleTrader = useCallback((traderId: string) => {
    setActiveTraders(prev => {
      const next = new Set(prev)
      if (next.has(traderId)) {
        next.delete(traderId)
      } else {
        next.add(traderId)
      }
      return next
    })
  }, [])

  // Quests filtered by active traders — passed to MapTileViewer for marker rendering
  const filteredQuests = useMemo(
    () => mapQuests.filter(q => activeTraders.has(q.traderId)),
    [mapQuests, activeTraders],
  )

  const hasTiles    = !!map.tileConfig && !tileFallback
  const isMultiFloor = map.mapType === 'multi-floor' && Array.isArray(map.floors) && map.floors.length > 0
  const hasQuests   = mapQuests.length > 0

  // Look up the calibration status for this map — passed to MapQuestFilter for
  // the "positions approximate" indicator, and to MapTileViewer for marker rendering.
  const { status: calibrationStatus } = getCalibrationForMap(map.id)

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

      {/* Quest filter — only shown when tiles are active and there are quests */}
      {hasTiles && hasQuests && (
        <MapQuestFilter
          quests={mapQuests}
          activeTraders={activeTraders}
          onToggle={toggleTrader}
          calibrationStatus={calibrationStatus}
        />
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
            quests={filteredQuests}
            rfMapId={map.id}
          />
        ) : (
          // Static fallback: original map images, maintained until tiles are verified
          <img
            src={fallbackSrc}
            alt={fallbackAlt}
            className="w-full object-contain max-h-[520px]"
          />
        )}

        <MapStatusBadge hasTiles={hasTiles} tileFallback={tileFallback} questCount={filteredQuests.filter(q => q.position !== null).length} />
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

function MapStatusBadge({
  hasTiles,
  tileFallback,
  questCount,
}: {
  hasTiles: boolean
  tileFallback: boolean
  questCount: number
}) {
  if (tileFallback) {
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
    return (
      <div className="absolute bottom-3 right-3">
        <span className="inline-flex items-center gap-1 text-[9px] text-white/20 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 border border-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-2.5 h-2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          {questCount > 0 ? `${questCount} quest marker${questCount !== 1 ? 's' : ''}` : 'No quest markers'}
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
