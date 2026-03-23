'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { MapMeta } from '../data/maps'
import type { MergedQuest } from '../types/quests'
import { getCalibrationForMap } from '../data/mapCalibration'
import MapQuestFilter from './MapQuestFilter'
import QuestDetailPanel from './QuestDetailPanel'

const MapTileViewer = dynamic(() => import('./MapTileViewer'), {
  ssr: false,
  loading: () => <TileLoadingState />,
})

interface Props {
  map: MapMeta
  mapQuests?: MergedQuest[]
}

export default function MapImageDisplay({ map, mapQuests = [] }: Props) {
  const [activeFloor, setActiveFloor]       = useState(0)
  const [tileFallback, setTileFallback]     = useState(false)
  const [selectedQuest, setSelectedQuest]   = useState<MergedQuest | null>(null)
  const [activeTraders, setActiveTraders]   = useState<Set<string>>(
    () => new Set(mapQuests.map(q => q.traderId)),
  )

  const handleTileFallback  = useCallback(() => setTileFallback(true), [])
  const handleQuestSelect   = useCallback((q: MergedQuest | null) => setSelectedQuest(q), [])

  const toggleTrader = useCallback((traderId: string) => {
    setActiveTraders(prev => {
      const next = new Set(prev)
      if (next.has(traderId)) next.delete(traderId)
      else next.add(traderId)
      return next
    })
  }, [])

  // If the selected quest's trader is toggled off, close the panel
  useEffect(() => {
    if (selectedQuest && !activeTraders.has(selectedQuest.traderId)) {
      setSelectedQuest(null)
    }
  }, [activeTraders, selectedQuest])

  const filteredQuests = useMemo(
    () => mapQuests.filter(q => activeTraders.has(q.traderId)),
    [mapQuests, activeTraders],
  )

  const hasTiles      = !!map.tileConfig && !tileFallback
  const isMultiFloor  = map.mapType === 'multi-floor' && Array.isArray(map.floors) && map.floors.length > 0
  const hasQuests     = mapQuests.length > 0
  const { status: calibrationStatus } = getCalibrationForMap(map.id)

  const fallbackSrc = isMultiFloor
    ? (map.floors![activeFloor]?.image ?? '/images/ARC_Maps.PNG')
    : (map.image ?? '/images/ARC_Maps.PNG')

  const fallbackAlt = isMultiFloor
    ? `${map.displayName} — ${map.floors![activeFloor]?.label ?? ''}`
    : map.displayName

  return (
    <div>
      {/* Floor switcher */}
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

      {/* Quest filter bar */}
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
          <MapTileViewer
            tileConfig={map.tileConfig!}
            activeLayerIndex={activeFloor}
            onFallback={handleTileFallback}
            quests={filteredQuests}
            rfMapId={map.id}
            onQuestSelect={handleQuestSelect}
          />
        ) : (
          <img
            src={fallbackSrc}
            alt={fallbackAlt}
            className="w-full object-contain max-h-[520px]"
          />
        )}

        {/* Quest detail panel — overlays right side of map on marker click */}
        {selectedQuest && (
          <QuestDetailPanel
            quest={selectedQuest}
            onClose={() => setSelectedQuest(null)}
          />
        )}

        <MapStatusBadge
          hasTiles={hasTiles}
          tileFallback={tileFallback}
          questCount={filteredQuests.filter(q => q.position !== null).length}
        />
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TileLoadingState() {
  return (
    <div className="w-full flex items-center justify-center bg-black/60" style={{ height: '520px' }}>
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
