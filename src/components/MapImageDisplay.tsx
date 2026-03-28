'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import type { MapMeta } from '../data/maps'
import type { MergedQuest } from '../types/quests'
import type { ContainerMarker, ContainerType, LootAreaMarker, LootAreaTier, MapLayerType } from '../types/mapLayers'
import { CONTAINER_TYPE_META, LOOT_AREA_TIER_META } from '../types/mapLayers'
import { getCalibrationForMap } from '../data/mapCalibration'
import { CONTAINERS_BY_MAP } from '../data/containers'
import {
    emptyMapProgressSave,
    isMapProgressSaveEmpty,
    isVisited,
    toggleVisit,
    type MapProgressSaveV1,
} from '@/lib/maps/mapProgressSave'
import { loadMapProgressSave, saveMapProgressSave } from '@/lib/maps/mapProgressSaveStorage'
import {
    getPoisForMap,
    filterPoisByCategories,
    filterPoisForFloor,
    POI_MVP_CATEGORIES,
    type MapPoi,
} from '@/lib/maps/pois'
import type { PoiCategory } from '@/lib/maps/poi-types'
import { PoiPlacementReadout, type PoiPlacementSample } from '@/components/maps/MapPoiLayer'
import { POI_CATEGORY_META } from '@/components/maps/MapPoiMarker'
import MapQuestFilter from './MapQuestFilter'
import QuestDetailPanel from './QuestDetailPanel'

const SHOW_POI_PLACEMENT = process.env.NEXT_PUBLIC_RF_POI_PLACEMENT === '1'

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
  /** Show fullscreen control for the tactical map block (map detail pages). */
  enableFullscreen?: boolean
}

export default function MapImageDisplay({
  map,
  mapQuests = [],
  mfLootAreas = [],
  enableFullscreen = false,
}: Props) {
  const { data: session, status: sessionStatus } = useSession()
  const userMutatedRef = useRef(false)
  const progressRef = useRef<MapProgressSaveV1>(emptyMapProgressSave())
  const persistenceRef = useRef<'local' | 'remote' | 'pending'>('local')

  const shellRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [mapProgress, setMapProgress] = useState<MapProgressSaveV1>(() =>
    typeof window === 'undefined' ? emptyMapProgressSave() : loadMapProgressSave()
  )
  const [progressStorageReady, setProgressStorageReady] = useState(false)
  const [progressPersistence, setProgressPersistence] = useState<'local' | 'remote' | 'pending'>('local')

  progressRef.current = mapProgress
  persistenceRef.current = progressPersistence

  const [activeFloor, setActiveFloor]         = useState(0)
  const [tileFallback, setTileFallback]       = useState(false)
  const [selectedQuest, setSelectedQuest]     = useState<MergedQuest | null>(null)
  const [selectedContainer, setSelectedContainer] = useState<ContainerMarker | null>(null)
  const [selectedLootArea, setSelectedLootArea]   = useState<LootAreaMarker | null>(null)
  const [activeTraders, setActiveTraders]     = useState<Set<string>>(
    () => new Set(mapQuests.map(q => q.traderId)),
  )
  const [activeLayers, setActiveLayers]       = useState<Set<MapLayerType>>(
    () => new Set<MapLayerType>(['quests', 'containers', 'loot_areas', 'pois']),
  )
  const [selectedPoi, setSelectedPoi]         = useState<MapPoi | null>(null)
  const [activePoiCategories, setActivePoiCategories] = useState<Set<PoiCategory>>(
    () => new Set(POI_MVP_CATEGORIES),
  )
  const [poiPlacementMode, setPoiPlacementMode] = useState(false)
  const [poiPlacementSample, setPoiPlacementSample] = useState<PoiPlacementSample | null>(null)

  const handleTileFallback = useCallback(() => setTileFallback(true), [])

  useEffect(() => {
    setActivePoiCategories(new Set(POI_MVP_CATEGORIES))
    setSelectedPoi(null)
    setPoiPlacementSample(null)
    setPoiPlacementMode(false)
  }, [map.id])

  useEffect(() => {
    setMapProgress(loadMapProgressSave())
    setProgressPersistence('local')
    setProgressStorageReady(true)
  }, [])

  useEffect(() => {
    if (!progressStorageReady) return
    if (sessionStatus === 'loading') return

    if (sessionStatus === 'unauthenticated') {
      if (persistenceRef.current === 'remote') {
        saveMapProgressSave(progressRef.current)
      } else {
        setMapProgress(loadMapProgressSave())
      }
      setProgressPersistence('local')
      userMutatedRef.current = false
      return
    }

    const uid = session?.user?.id
    if (!uid) {
      if (persistenceRef.current === 'remote') {
        saveMapProgressSave(progressRef.current)
      } else {
        setMapProgress(loadMapProgressSave())
      }
      setProgressPersistence('local')
      userMutatedRef.current = false
      return
    }

    let cancelled = false
    setProgressPersistence('pending')

    ;(async () => {
      const res = await fetch('/api/user/map-progress', { credentials: 'same-origin' })
      if (cancelled) return

      if (res.status === 401 || res.status === 503 || !res.ok) {
        setProgressPersistence('local')
        userMutatedRef.current = false
        return
      }

      const data = (await res.json()) as { save?: MapProgressSaveV1 | null }
      let nextSave: MapProgressSaveV1 =
        data.save === null || data.save === undefined
          ? emptyMapProgressSave()
          : {
              version: 1,
              maps:
                typeof data.save.maps === 'object' && data.save.maps !== null && !Array.isArray(data.save.maps)
                  ? { ...data.save.maps }
                  : {},
            }

      if (isMapProgressSaveEmpty(nextSave)) {
        const local = loadMapProgressSave()
        if (!isMapProgressSaveEmpty(local)) {
          const seeded = await fetch('/api/user/map-progress', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ save: local }),
          })
          if (seeded.ok) {
            const r2 = await fetch('/api/user/map-progress', { credentials: 'same-origin' })
            if (r2.ok) {
              const d2 = (await r2.json()) as { save?: MapProgressSaveV1 | null }
              if (d2.save && typeof d2.save.maps === 'object' && d2.save.maps !== null) {
                nextSave = { version: 1, maps: { ...d2.save.maps } }
              }
            }
          }
        }
      }

      if (cancelled) return
      userMutatedRef.current = false
      setMapProgress(nextSave)
      setProgressPersistence('remote')
    })()

    return () => {
      cancelled = true
    }
  }, [progressStorageReady, sessionStatus, session?.user?.id])

  useEffect(() => {
    if (!progressStorageReady) return
    if (progressPersistence !== 'local') return
    saveMapProgressSave(mapProgress)
  }, [mapProgress, progressStorageReady, progressPersistence])

  useEffect(() => {
    if (!progressStorageReady) return
    if (progressPersistence !== 'remote') return
    if (!userMutatedRef.current) return

    const t = window.setTimeout(async () => {
      const payload = progressRef.current
      try {
        const res = await fetch('/api/user/map-progress', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ save: payload }),
        })
        if (res.ok) userMutatedRef.current = false
      } catch {
        /* leave dirty */
      }
    }, 450)
    return () => window.clearTimeout(t)
  }, [mapProgress, progressPersistence, progressStorageReady])

  const visitQuest = useCallback(
    (questName: string, visited: boolean) => {
      userMutatedRef.current = true
      setMapProgress(prev => toggleVisit(prev, map.id, 'q', questName, visited))
    },
    [map.id]
  )

  const visitContainer = useCallback(
    (containerId: string, visited: boolean) => {
      userMutatedRef.current = true
      setMapProgress(prev => toggleVisit(prev, map.id, 'c', containerId, visited))
    },
    [map.id]
  )

  const visitLootArea = useCallback(
    (lootId: string, visited: boolean) => {
      userMutatedRef.current = true
      setMapProgress(prev => toggleVisit(prev, map.id, 'l', lootId, visited))
    },
    [map.id]
  )

  const visitPoiPin = useCallback(
    (poiId: string, visited: boolean) => {
      userMutatedRef.current = true
      setMapProgress(prev => toggleVisit(prev, map.id, 'p', poiId, visited))
    },
    [map.id]
  )

  useEffect(() => {
    const onFs = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current)
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const el = shellRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) await el.requestFullscreen()
      else await document.exitFullscreen()
    } catch {
      /* browser may block without user gesture */
    }
  }, [])

  // Selecting a quest clears container + loot area selection (mutual exclusion keeps UI clean)
  const handleQuestSelect = useCallback((q: MergedQuest | null) => {
    setSelectedQuest(q)
    if (q !== null) {
      setSelectedContainer(null)
      setSelectedLootArea(null)
      setSelectedPoi(null)
    }
  }, [])

  // Selecting a container clears quest panel + loot area selection
  const handleContainerSelect = useCallback((c: ContainerMarker | null) => {
    setSelectedContainer(c)
    if (c !== null) {
      setSelectedQuest(null)
      setSelectedLootArea(null)
      setSelectedPoi(null)
    }
  }, [])

  // Selecting a loot area clears quest + container selections
  const handleLootAreaSelect = useCallback((a: LootAreaMarker | null) => {
    setSelectedLootArea(a)
    if (a !== null) {
      setSelectedQuest(null)
      setSelectedContainer(null)
      setSelectedPoi(null)
    }
  }, [])

  const handlePoiSelect = useCallback((p: MapPoi | null) => {
    setSelectedPoi(p)
    if (p !== null) {
      setSelectedQuest(null)
      setSelectedContainer(null)
      setSelectedLootArea(null)
    }
  }, [])

  const togglePoiCategory = useCallback((c: PoiCategory) => {
    setActivePoiCategories(prev => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }, [])

  const showAllPoiCategories = useCallback(() => {
    setActivePoiCategories(new Set(POI_MVP_CATEGORIES))
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
    if (selectedPoi       && !activeLayers.has('pois'))        setSelectedPoi(null)
  }, [activeLayers, selectedQuest, selectedContainer, selectedLootArea, selectedPoi])

  // ESC closes whichever overlay is open
  useEffect(() => {
    if (!selectedQuest && !selectedContainer && !selectedLootArea && !selectedPoi) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedQuest(null)
        setSelectedContainer(null)
        setSelectedLootArea(null)
        setSelectedPoi(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedQuest, selectedContainer, selectedLootArea, selectedPoi])

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

  const mapPois = useMemo(() => getPoisForMap(map.id), [map.id])
  const poisForFloor = useMemo(
    () => filterPoisForFloor(mapPois, activeFloor),
    [mapPois, activeFloor],
  )
  const visiblePoisFiltered = useMemo(
    () => filterPoisByCategories(poisForFloor, activePoiCategories),
    [poisForFloor, activePoiCategories],
  )
  const visiblePoisOnMap = activeLayers.has('pois') ? visiblePoisFiltered : []

  /** Pin categories present in static data for this map — legend + consistent ordering. */
  const poiCategoriesOnMap = useMemo(() => {
    const order = new Map(POI_MVP_CATEGORIES.map((c, i) => [c, i]))
    const seen = new Set<PoiCategory>()
    for (const p of mapPois) seen.add(p.category)
    return [...seen].sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99))
  }, [mapPois])

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
  const showMapFilters =
    hasTiles &&
    (hasQuests || mapPois.length > 0 || ALL_CONTAINERS.length > 0 || mfLootAreas.length > 0)
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
  const visiblePoiMarkerCount       = visiblePoisOnMap.length

  return (
    <div
      ref={shellRef}
      className={
        enableFullscreen && isFullscreen
          ? 'min-h-screen flex flex-col bg-[#050508]'
          : undefined
      }
    >
      {enableFullscreen && (
        <div className="flex justify-end px-2 py-1.5 border-b border-white/[0.06] bg-black/25 shrink-0 z-[10]">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="text-[10px] font-semibold uppercase tracking-wider
                       rounded-lg border border-white/15 bg-white/5 px-3 py-1.5
                       text-rf-text hover:border-rf-red/35 hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? 'Exit fullscreen' : 'Fullscreen map'}
          </button>
        </div>
      )}

      {/* Floor switcher */}
      {isMultiFloor && (
        <div
          className={`flex items-center gap-1 px-4 py-3 border-b border-white/5 bg-black/20 ${
            enableFullscreen && isFullscreen ? 'shrink-0' : ''
          }`}
        >
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
      {showMapFilters && (
        <div className={enableFullscreen && isFullscreen ? 'shrink-0' : undefined}>
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
            poiCount={mapPois.length}
            visiblePoiCount={visiblePoiMarkerCount}
            activePoiCategories={activePoiCategories}
            onTogglePoiCategory={togglePoiCategory}
            onPoiCategoriesShowAll={showAllPoiCategories}
          />
        </div>
      )}

      {/* Map surface */}
      <div
        className={`relative bg-black/40 ${
          enableFullscreen && isFullscreen ? 'flex-1 min-h-0 flex flex-col' : ''
        }`}
      >
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
            pois={visiblePoisOnMap}
            selectedPoiId={selectedPoi?.id ?? null}
            onPoiSelect={handlePoiSelect}
            poiPlacementMode={SHOW_POI_PLACEMENT && poiPlacementMode}
            onPoiPlacementSample={setPoiPlacementSample}
            fillContainer={enableFullscreen && isFullscreen}
            mapHeight="min(72vh, 720px)"
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
              visited={isVisited(mapProgress, map.id, 'q', selectedQuest.name)}
              onVisitedChange={v => visitQuest(selectedQuest.name, v)}
            />
          </div>
        )}

        {/* Container info badge — top-center, animates in on container click */}
        {selectedContainer && (
          <ContainerInfoBadge
            key={selectedContainer.id}
            container={selectedContainer}
            onClose={() => setSelectedContainer(null)}
            visited={isVisited(mapProgress, map.id, 'c', selectedContainer.id)}
            onVisitedChange={v => visitContainer(selectedContainer.id, v)}
          />
        )}

        {/* Loot area info badge — top-center, animates in on loot area click */}
        {selectedLootArea && (
          <LootAreaInfoBadge
            key={selectedLootArea.id}
            area={selectedLootArea}
            onClose={() => setSelectedLootArea(null)}
            visited={isVisited(mapProgress, map.id, 'l', selectedLootArea.id)}
            onVisitedChange={v => visitLootArea(selectedLootArea.id, v)}
          />
        )}

        {selectedPoi && (
          <PoiInfoBadge
            key={selectedPoi.id}
            poi={selectedPoi}
            onClose={() => setSelectedPoi(null)}
            visited={isVisited(mapProgress, map.id, 'p', selectedPoi.id)}
            onVisitedChange={v => visitPoiPin(selectedPoi.id, v)}
          />
        )}

        {SHOW_POI_PLACEMENT && hasTiles && (
          <PoiPlacementReadout
            sample={poiPlacementSample}
            placementMode={poiPlacementMode}
            onToggleMode={() => setPoiPlacementMode(v => !v)}
            onClear={() => setPoiPlacementSample(null)}
          />
        )}

        {/* Combined marker legend — bottom-left, shows active container types + loot tiers */}
        {hasTiles && (
          <MapMarkerLegend
            containerTypes={activeContainerTypes}
            lootAreaTiers={activeLootAreaTiers}
            poiCategoriesForLegend={
              activeLayers.has('pois') && mapPois.length > 0 ? poiCategoriesOnMap : []
            }
          />
        )}

        <MapStatusBadge
          hasTiles={hasTiles}
          tileFallback={tileFallback}
          questMarkerCount={visibleQuestMarkerCount}
          containerMarkerCount={visibleContainerMarkerCount}
          lootAreaMarkerCount={visibleLootAreaMarkerCount}
          poiMarkerCount={visiblePoiMarkerCount}
        />

        {hasTiles && (
          <div className="absolute bottom-14 left-3 z-[510] max-w-[12rem] pointer-events-none">
            <p className="text-[9px] leading-snug text-white/35">
              {progressPersistence === 'remote'
                ? 'POI visits sync to your account.'
                : progressPersistence === 'local' && sessionStatus === 'authenticated'
                  ? 'POI visits on this device only (no DB).'
                  : 'POI visits on this device.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Curated POI info badge ─────────────────────────────────────────────────────

function PoiInfoBadge({
  poi,
  onClose,
  visited,
  onVisitedChange,
}: {
  poi: MapPoi
  onClose: () => void
  visited: boolean
  onVisitedChange: (visited: boolean) => void
}) {
  const meta = POI_CATEGORY_META[poi.category]

  return (
    <div
      className="rf-badge-enter absolute top-3 left-1/2 -translate-x-1/2 z-[999] w-[min(100vw-1.5rem,20rem)] pointer-events-auto"
      onClick={e => e.stopPropagation()}
    >
      <div className="rounded-xl border border-white/[0.1] bg-black/90 backdrop-blur-md shadow-xl shadow-black/60 overflow-hidden">
        <div
          className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.06]"
          style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 shrink-0 rounded-[3px] border border-white/20"
              style={{ background: meta.color, boxShadow: `0 0 10px ${meta.color}66` }}
              aria-hidden
            />
            <span
              className="text-[10px] font-semibold uppercase tracking-widest truncate"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="shrink-0 rounded-md p-1 text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-3 py-2.5 space-y-2">
          <h3 className="text-sm font-semibold text-white/95 leading-snug pr-1">{poi.name}</h3>
          {poi.description ? (
            <p className="text-[12px] text-white/55 leading-relaxed max-h-[7.5rem] overflow-y-auto pr-0.5">
              {poi.description}
            </p>
          ) : null}
          {poi.tags && poi.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {poi.tags.map(t => (
                <span
                  key={t}
                  className="text-[9px] px-1.5 py-px rounded-md bg-white/[0.06] text-white/40 border border-white/[0.06]"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          {(poi.questIds?.length || poi.itemIds?.length) ? (
            <dl className="text-[10px] space-y-1.5 border-t border-white/[0.06] pt-2">
              {poi.questIds && poi.questIds.length > 0 && (
                <div>
                  <dt className="text-white/35 uppercase tracking-wide text-[9px] mb-0.5">Quest links</dt>
                  <dd className="text-white/50 font-mono leading-snug break-all">{poi.questIds.join(' · ')}</dd>
                </div>
              )}
              {poi.itemIds && poi.itemIds.length > 0 && (
                <div>
                  <dt className="text-white/35 uppercase tracking-wide text-[9px] mb-0.5">Item links</dt>
                  <dd className="text-white/50 font-mono leading-snug break-all">{poi.itemIds.join(' · ')}</dd>
                </div>
              )}
            </dl>
          ) : null}
        </div>
        <label className="flex items-center justify-between gap-2 px-3 py-2 border-t border-white/[0.06] bg-white/[0.03] cursor-pointer select-none">
          <span className="text-[11px] text-white/45">Cleared / visited</span>
          <input
            type="checkbox"
            checked={visited}
            onChange={e => onVisitedChange(e.target.checked)}
            className="rounded border-white/25 bg-black/50 w-3.5 h-3.5"
          />
        </label>
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
  visited = false,
  onVisitedChange,
}: {
  container: ContainerMarker
  onClose: () => void
  visited?: boolean
  onVisitedChange?: (visited: boolean) => void
}) {
  const meta = CONTAINER_TYPE_META[container.containerType]

  return (
    <div
      className="rf-badge-enter absolute top-3 left-1/2 -translate-x-1/2 z-[999] flex flex-wrap items-center gap-2.5 bg-black/88 backdrop-blur-sm rounded-lg border border-white/[0.08] px-3 py-2 shadow-xl shadow-black/50 pointer-events-auto max-w-[min(100vw-1.5rem,22rem)]"
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

      {onVisitedChange && (
        <label className="flex items-center gap-1.5 cursor-pointer select-none pointer-events-auto shrink-0">
          <input
            type="checkbox"
            checked={visited}
            onChange={e => onVisitedChange(e.target.checked)}
            className="rounded border-white/20 bg-black/40"
          />
          <span className="text-[10px] text-white/50 whitespace-nowrap">Visited</span>
        </label>
      )}

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
  visited = false,
  onVisitedChange,
}: {
  area: LootAreaMarker
  onClose: () => void
  visited?: boolean
  onVisitedChange?: (visited: boolean) => void
}) {
  const meta = LOOT_AREA_TIER_META[area.tier]

  return (
    <div
      className="rf-badge-enter absolute top-3 left-1/2 -translate-x-1/2 z-[999] flex flex-wrap items-center gap-2.5 bg-black/88 backdrop-blur-sm rounded-lg border border-white/[0.08] px-3 py-2 shadow-xl shadow-black/50 pointer-events-auto max-w-[min(100vw-1.5rem,22rem)]"
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

      {onVisitedChange && (
        <label className="flex items-center gap-1.5 cursor-pointer select-none pointer-events-auto shrink-0">
          <input
            type="checkbox"
            checked={visited}
            onChange={e => onVisitedChange(e.target.checked)}
            className="rounded border-white/20 bg-black/40"
          />
          <span className="text-[10px] text-white/50 whitespace-nowrap">Visited</span>
        </label>
      )}

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
  poiCategoriesForLegend,
}: {
  containerTypes: ContainerType[]
  lootAreaTiers: LootAreaTier[]
  poiCategoriesForLegend: PoiCategory[]
}) {
  if (
    containerTypes.length === 0 &&
    lootAreaTiers.length === 0 &&
    poiCategoriesForLegend.length === 0
  ) {
    return null
  }

  return (
    <div className="absolute bottom-3 left-3 z-[500] flex flex-col gap-1 pointer-events-none">
      {poiCategoriesForLegend.length > 0 && (
        <div className="flex flex-col gap-0.5 mb-0.5">
          <span className="text-[8px] uppercase tracking-widest text-white/30 px-2 font-semibold">
            Pins
          </span>
          {poiCategoriesForLegend.map(cat => {
            const meta = POI_CATEGORY_META[cat]
            return (
              <div
                key={`poi-cat-${cat}`}
                className="flex items-center gap-1.5 text-[9px] font-medium text-white/50 bg-black/65 backdrop-blur-sm rounded-md px-2 py-1 border border-white/[0.06]"
              >
                <span
                  className="w-2 h-2 flex-shrink-0 rounded-[2px] border border-white/15"
                  style={{ background: meta.color }}
                />
                {meta.label}
              </div>
            )
          })}
        </div>
      )}
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
    <div
      className="w-full flex items-center justify-center bg-black/60"
      style={{ minHeight: 'min(72vh, 720px)' }}
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
  questMarkerCount,
  containerMarkerCount,
  lootAreaMarkerCount,
  poiMarkerCount,
}: {
  hasTiles: boolean
  tileFallback: boolean
  questMarkerCount: number
  containerMarkerCount: number
  lootAreaMarkerCount: number
  poiMarkerCount: number
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
    const totalMarkers =
      questMarkerCount + containerMarkerCount + lootAreaMarkerCount + poiMarkerCount
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
