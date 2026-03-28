'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { MapMeta } from '../data/maps'
import type { MergedQuest } from '../types/quests'
import type { ContainerMarker, ContainerType, LootAreaMarker, LootAreaTier, MapLayerType } from '../types/mapLayers'
import { CONTAINER_TYPE_META, LOOT_AREA_TIER_META } from '../types/mapLayers'
import { getCalibrationForMap } from '../data/mapCalibration'
import { CONTAINERS_BY_MAP } from '../data/containers'
import MapQuestFilter from './MapQuestFilter'
import QuestDetailPanel from './QuestDetailPanel'

const MapTileViewer = dynamic(() => import('./MapTileViewer'), {
  ssr: false,
  loading: () => <TileLoadingState />,
})

interface Props {
  map: MapMeta
  mapQuests?: MergedQuest[]
  /**
   * Loot area markers from MetaForge /api/game-map-data (via getMetaforgeMapLootAreas).
   * Empty when the MetaForge API is unavailable (HTTP 500 as of 2026-03).
   * The layer toggle will show "—" when this is empty.
   */
  mfLootAreas?: LootAreaMarker[]
}

export default function MapImageDisplay({ map, mapQuests = [], mfLootAreas = [] }: Props) {
  const [activeFloor, setActiveFloor]         = useState(0)
  const [tileFallback, setTileFallback]       = useState(false)
  const [selectedQuest, setSelectedQuest]     = useState<MergedQuest | null>(null)
  const [selectedContainer, setSelectedContainer] = useState<ContainerMarker | null>(null)
  const [selectedLootArea, setSelectedLootArea]   = useState<LootAreaMarker | null>(null)
  const [activeTraders, setActiveTraders]     = useState<Set<string>>(
    () => new Set(mapQuests.map(q => q.traderId)),
  )
  const [activeLayers, setActiveLayers]       = useState<Set<MapLayerType>>(
    () => new Set<MapLayerType>(['quests', 'containers', 'loot_areas']),
  )

  const handleTileFallback = useCallback(() => setTileFallback(true), [])

  // Selecting a quest clears container + loot area selection (mutual exclusion keeps UI clean)
  const handleQuestSelect = useCallback((q: MergedQuest | null) => {
    setSelectedQuest(q)
    if (q !== null) { setSelectedContainer(null); setSelectedLootArea(null) }
  }, [])

  // Selecting a container clears quest panel + loot area selection
  const handleContainerSelect = useCallback((c: ContainerMarker | null) => {
    setSelectedContainer(c)
    if (c !== null) { setSelectedQuest(null); setSelectedLootArea(null) }
  }, [])

  // Selecting a loot area clears quest + container selections
  const handleLootAreaSelect = useCallback((a: LootAreaMarker | null) => {
    setSelectedLootArea(a)
    if (a !== null) { setSelectedQuest(null); setSelectedContainer(null) }
  }, [])

  const toggleTrader = useCallback((traderId: string) => {
    setActiveTraders(prev => {
      const next = new Set(prev)
      if (next.has(traderId)) next.delete(traderId)
      else next.add(traderId)
      return next
    })
  }, [])

  const toggleLayer = useCallback((type: MapLayerType) => {
    setActiveLayers(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

  /** Restore all traders to active. */
  const clearAllFilters = useCallback(() => {
    setActiveTraders(new Set(mapQuests.map(q => q.traderId)))
  }, [mapQuests])

  // If the selected quest's trader is toggled off, close the panel
  useEffect(() => {
    if (selectedQuest && !activeTraders.has(selectedQuest.traderId)) {
      setSelectedQuest(null)
    }
  }, [activeTraders, selectedQuest])

  // Layer-off → close relevant selection
  useEffect(() => {
    if (selectedQuest     && !activeLayers.has('quests'))      setSelectedQuest(null)
    if (selectedContainer && !activeLayers.has('containers'))  setSelectedContainer(null)
    if (selectedLootArea  && !activeLayers.has('loot_areas'))  setSelectedLootArea(null)
  }, [activeLayers, selectedQuest, selectedContainer, selectedLootArea])

  // ESC closes whichever overlay is open
  useEffect(() => {
    if (!selectedQuest && !selectedContainer && !selectedLootArea) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedQuest(null)
        setSelectedContainer(null)
        setSelectedLootArea(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedQuest, selectedContainer, selectedLootArea])

  /**
   * Quests for active traders — drives MapTileViewer quest marker re-render.
   * Empty when quest layer is toggled off (hides all quest markers).
   */
  const visibleQuestPool = activeLayers.has('quests') ? mapQuests : []
  const filteredQuests   = useMemo(
    () => visibleQuestPool.filter(q => activeTraders.has(q.traderId)),
    [visibleQuestPool, activeTraders],
  )

  /** All curated container markers for this map. Empty for maps with no data yet. */
  const ALL_CONTAINERS: ContainerMarker[] = CONTAINERS_BY_MAP[map.id] ?? []
  const visibleContainers: ContainerMarker[] = activeLayers.has('containers')
    ? ALL_CONTAINERS
    : []

  /** Unique container types present in the visible container set — used for legend. */
  const activeContainerTypes = useMemo<ContainerType[]>(() => {
    if (visibleContainers.length === 0) return []
    const seen = new Set<ContainerType>()
    for (const c of visibleContainers) seen.add(c.containerType)
    return [...seen]
  }, [visibleContainers])

  /**
   * Loot area markers gated by the 'loot_areas' layer toggle.
   * Empty when MetaForge API is unavailable or the layer is toggled off.
   */
  const visibleLootAreas: LootAreaMarker[] = activeLayers.has('loot_areas')
    ? mfLootAreas
    : []

  /** Unique tiers present in the visible loot area set — used for legend. */
  const activeLootAreaTiers = useMemo<LootAreaTier[]>(() => {
    if (visibleLootAreas.length === 0) return []
    const seen = new Set<LootAreaTier>()
    for (const a of visibleLootAreas) seen.add(a.tier)
    return [...seen]
  }, [visibleLootAreas])

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

  // Visible marker counts for the status badge
  const visibleQuestMarkerCount     = filteredQuests.filter(q => q.position !== null).length
  const visibleContainerMarkerCount = visibleContainers.length
  const visibleLootAreaMarkerCount  = visibleLootAreas.length

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

      {/* Filter bar — layer toggles + trader toggles */}
      {hasTiles && hasQuests && (
        <MapQuestFilter
          quests={mapQuests}
          activeTraders={activeTraders}
          onToggle={toggleTrader}
          onClearAll={clearAllFilters}
          calibrationStatus={calibrationStatus}
          activeLayers={activeLayers}
          onLayerToggle={toggleLayer}
          containerCount={ALL_CONTAINERS.length}
          lootAreaCount={mfLootAreas.length}
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
            allQuests={visibleQuestPool}
            selectedQuestName={selectedQuest?.name ?? null}
            rfMapId={map.id}
            onQuestSelect={handleQuestSelect}
            containers={visibleContainers}
            selectedContainerId={selectedContainer?.id ?? null}
            onContainerSelect={handleContainerSelect}
            lootAreas={visibleLootAreas}
            selectedLootAreaId={selectedLootArea?.id ?? null}
            onLootAreaSelect={handleLootAreaSelect}
          />
        ) : (
          <img
            src={fallbackSrc}
            alt={fallbackAlt}
            className="w-full object-contain max-h-[520px]"
          />
        )}

        {/* Quest detail panel — animates in from right on marker click.
            key={quest.name} re-triggers the CSS enter animation when switching quests. */}
        {selectedQuest && (
          <div
            key={selectedQuest.name}
            className="rf-panel-enter absolute top-0 right-0 h-full w-64 z-[1000]"
          >
            <QuestDetailPanel
              quest={selectedQuest}
              onClose={() => setSelectedQuest(null)}
            />
          </div>
        )}

        {/* Container info badge — top-center, animates in on container click */}
        {selectedContainer && (
          <ContainerInfoBadge
            key={selectedContainer.id}
            container={selectedContainer}
            onClose={() => setSelectedContainer(null)}
          />
        )}

        {/* Loot area info badge — top-center, animates in on loot area click */}
        {selectedLootArea && (
          <LootAreaInfoBadge
            key={selectedLootArea.id}
            area={selectedLootArea}
            onClose={() => setSelectedLootArea(null)}
          />
        )}

        {/* Combined marker legend — bottom-left, shows active container types + loot tiers */}
        {hasTiles && (
          <MapMarkerLegend
            containerTypes={activeContainerTypes}
            lootAreaTiers={activeLootAreaTiers}
          />
        )}

        <MapStatusBadge
          hasTiles={hasTiles}
          tileFallback={tileFallback}
          questMarkerCount={visibleQuestMarkerCount}
          containerMarkerCount={visibleContainerMarkerCount}
          lootAreaMarkerCount={visibleLootAreaMarkerCount}
        />
      </div>
    </div>
  )
}

// ── Container info badge ──────────────────────────────────────────────────────
// Appears top-center of the map surface when a container marker is clicked.
// Shows the container type (color-coded) and its landmark label.

function ContainerInfoBadge({
  container,
  onClose,
}: {
  container: ContainerMarker
  onClose: () => void
}) {
  const meta = CONTAINER_TYPE_META[container.containerType]

  return (
    <div
      className="rf-badge-enter absolute top-3 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2.5 bg-black/88 backdrop-blur-sm rounded-lg border border-white/[0.08] px-3 py-2 shadow-xl shadow-black/50 pointer-events-auto whitespace-nowrap"
      onClick={e => e.stopPropagation()}
    >
      {/* Diamond indicator matching marker shape */}
      <span
        className="w-3 h-3 flex-shrink-0 rotate-45 rounded-[1px]"
        style={{
          background:  meta.color,
          boxShadow:   `0 0 8px ${meta.color}80`,
        }}
      />

      <div className="flex flex-col min-w-0">
        <span
          className="text-[9px] uppercase tracking-widest leading-none mb-0.5 font-semibold"
          style={{ color: meta.color }}
        >
          {meta.label}
        </span>
        {container.label && (
          <span className="text-[11px] font-medium text-white/80 leading-tight">
            {container.label}
          </span>
        )}
      </div>

      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="flex-shrink-0 text-white/25 hover:text-white/70 transition-colors ml-0.5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-3 h-3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ── Loot area info badge ──────────────────────────────────────────────────────
// Appears top-center when a loot area marker is clicked.
// Shows the tier (color-coded) and zone name.

function LootAreaInfoBadge({
  area,
  onClose,
}: {
  area: LootAreaMarker
  onClose: () => void
}) {
  const meta = LOOT_AREA_TIER_META[area.tier]

  return (
    <div
      className="rf-badge-enter absolute top-3 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2.5 bg-black/88 backdrop-blur-sm rounded-lg border border-white/[0.08] px-3 py-2 shadow-xl shadow-black/50 pointer-events-auto whitespace-nowrap"
      onClick={e => e.stopPropagation()}
    >
      {/* Hollow circle indicator matching marker shape */}
      <span
        className="w-3 h-3 flex-shrink-0 rounded-full border-2"
        style={{
          borderColor: meta.color,
          boxShadow:   `0 0 6px ${meta.color}80`,
        }}
      />

      <div className="flex flex-col min-w-0">
        <span
          className="text-[9px] uppercase tracking-widest leading-none mb-0.5 font-semibold"
          style={{ color: meta.color }}
        >
          {meta.label}
        </span>
        <span className="text-[11px] font-medium text-white/80 leading-tight">
          {area.name}
        </span>
      </div>

      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="flex-shrink-0 text-white/25 hover:text-white/70 transition-colors ml-0.5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-3 h-3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ── Combined map marker legend ─────────────────────────────────────────────────
// Compact bottom-left overlay listing active container types and loot area tiers.
// Replaces the original ContainerLegend — handles both marker categories together
// so their legend entries stack in one visual group without overlap.
// Only renders when at least one marker category is visible on the current map.

function MapMarkerLegend({
  containerTypes,
  lootAreaTiers,
}: {
  containerTypes: ContainerType[]
  lootAreaTiers:  LootAreaTier[]
}) {
  if (containerTypes.length === 0 && lootAreaTiers.length === 0) return null

  return (
    <div className="absolute bottom-3 left-3 z-[500] flex flex-col gap-1 pointer-events-none">
      {/* Loot area tiers — hollow circle swatch */}
      {lootAreaTiers.map(tier => {
        const meta = LOOT_AREA_TIER_META[tier]
        return (
          <div
            key={`loot-${tier}`}
            className="flex items-center gap-1.5 text-[9px] font-medium text-white/50 bg-black/65 backdrop-blur-sm rounded-md px-2 py-1 border border-white/[0.06]"
          >
            <span
              className="w-2 h-2 flex-shrink-0 rounded-full border"
              style={{ borderColor: meta.color }}
            />
            {meta.label}
          </div>
        )
      })}
      {/* Container types — rotated-diamond swatch */}
      {containerTypes.map(type => {
        const meta = CONTAINER_TYPE_META[type]
        return (
          <div
            key={`cont-${type}`}
            className="flex items-center gap-1.5 text-[9px] font-medium text-white/50 bg-black/65 backdrop-blur-sm rounded-md px-2 py-1 border border-white/[0.06]"
          >
            <span
              className="w-2 h-2 flex-shrink-0 rotate-45 rounded-[1px]"
              style={{ background: meta.color }}
            />
            {meta.label}
          </div>
        )
      })}
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
  questMarkerCount,
  containerMarkerCount,
  lootAreaMarkerCount,
}: {
  hasTiles: boolean
  tileFallback: boolean
  questMarkerCount: number
  containerMarkerCount: number
  lootAreaMarkerCount: number
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
    const totalMarkers = questMarkerCount + containerMarkerCount + lootAreaMarkerCount
    const label = totalMarkers > 0
      ? `${totalMarkers} marker${totalMarkers !== 1 ? 's' : ''}`
      : 'No markers'

    return (
      <div className="absolute bottom-3 right-3">
        <span className="inline-flex items-center gap-1 text-[9px] text-white/20 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 border border-white/5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-2.5 h-2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          {label}
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
