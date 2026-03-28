'use client'

/**
 * NativeMapExplorer — RaiderForge-native interactive map shell.
 *
 * Replaces MapImageDisplay on the map detail pages. Wraps MapTileViewer
 * with TCNO-inspired controls (difficulty, search, category panel) while
 * maintaining full RaiderForge styling.
 *
 * Architecture:
 *   - Difficulty selector: filters POIs by `difficulties[]` tag; no tile change
 *   - Category panel: grouped toggle for all 10 POI categories
 *   - Search: narrows visible pins by name / description match
 *   - Floor selector: visible only for multi-floor maps (Stella Montis)
 *   - Quest / container / loot layers: separate from POI pins, toggled independently
 *   - Attribution: visible TCNO credit row with permission link
 *
 * Reusable for all five maps — just pass the correct `map` prop.
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { MapMeta } from '@/data/maps'
import type { MergedQuest } from '@/types/quests'
import type { LootAreaMarker } from '@/types/mapLayers'
import type { MapPoi, PoiCategory, Difficulty } from '@/lib/maps/poi-types'
import { getPoisForMap, filterPoisByCategories, filterPoisForFloor } from '@/lib/maps/pois'
import {
    getDifficultiesForMap,
    CATEGORY_GROUPS,
    DEFAULT_ACTIVE_CATEGORIES,
    getTcnoUrl,
} from '@/lib/maps/map-interactive-config'
import { POI_CATEGORY_META } from '@/components/maps/MapPoiMarker'
import { CONTAINERS_BY_MAP } from '@/data/containers'

const MapTileViewer = dynamic(() => import('@/components/MapTileViewer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-rf-bg flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-rf-orange/40 border-t-rf-orange rounded-full animate-spin" />
                <span className="text-[11px] text-white/25 uppercase tracking-widest">Loading map</span>
            </div>
        </div>
    ),
})

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
    map: MapMeta
    mapQuests?: MergedQuest[]
    mfLootAreas?: LootAreaMarker[]
}

// ── Data layer state type ──────────────────────────────────────────────────────

type DataLayers = {
    quests: boolean
    containers: boolean
    lootAreas: boolean
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function NativeMapExplorer({
    map,
    mapQuests = [],
    mfLootAreas = [],
}: Props) {
    // ── State ──────────────────────────────────────────────────────────────────
    const [difficulty, setDifficulty]     = useState<Difficulty>('Normal')
    const [search, setSearch]             = useState('')
    const [activeFloor, setActiveFloor]   = useState(0)
    const [showPanel, setShowPanel]       = useState(false)
    const [selectedPoi, setSelectedPoi]   = useState<MapPoi | null>(null)
    const [selectedQuestName, setSelectedQuestName] = useState<string | null>(null)
    const [tileFallback, setTileFallback] = useState(false)

    const [activeCategories, setActiveCategories] = useState<Set<PoiCategory>>(
        () => new Set(DEFAULT_ACTIVE_CATEGORIES),
    )
    const [dataLayers, setDataLayers] = useState<DataLayers>({
        quests:     true,
        containers: false,
        lootAreas:  false,
    })

    const searchRef = useRef<HTMLInputElement>(null)

    // ── Derived data ───────────────────────────────────────────────────────────
    const allPois = useMemo(() => getPoisForMap(map.id), [map.id])

    const filteredPois = useMemo((): MapPoi[] => {
        let pois = filterPoisByCategories(allPois, activeCategories)
        pois = filterPoisForFloor(pois, activeFloor)

        // Difficulty: hide POIs locked to other difficulties
        if (difficulty !== 'Normal') {
            pois = pois.filter(p =>
                !p.difficulties || p.difficulties.includes(difficulty),
            )
        }

        // Search: narrow by name or description
        const q = search.trim().toLowerCase()
        if (q) {
            pois = pois.filter(
                p =>
                    p.name.toLowerCase().includes(q) ||
                    p.description?.toLowerCase().includes(q),
            )
        }

        return pois
    }, [allPois, activeCategories, activeFloor, difficulty, search])

    const difficulties  = useMemo(() => getDifficultiesForMap(map.id), [map.id])
    const tcnoUrl       = getTcnoUrl(map.id)
    const isMultiFloor  = map.mapType === 'multi-floor' && (map.floors?.length ?? 0) > 1
    const containers    = useMemo(
        () => (dataLayers.containers ? (CONTAINERS_BY_MAP[map.id] ?? []) : []),
        [dataLayers.containers, map.id],
    )
    const lootAreas     = dataLayers.lootAreas ? mfLootAreas : []
    const activeQuests  = dataLayers.quests ? mapQuests : []

    // Category counts — shown per-category in the panel
    const poiCountByCategory = useMemo(() => {
        const counts: Partial<Record<PoiCategory, number>> = {}
        for (const p of filteredPois) {
            counts[p.category] = (counts[p.category] ?? 0) + 1
        }
        return counts
    }, [filteredPois])

    // ── Callbacks ──────────────────────────────────────────────────────────────
    const toggleCategory = useCallback((cat: PoiCategory) => {
        setActiveCategories(prev => {
            const next = new Set(prev)
            if (next.has(cat)) next.delete(cat)
            else next.add(cat)
            return next
        })
    }, [])

    const toggleAllInGroup = useCallback((cats: PoiCategory[]) => {
        setActiveCategories(prev => {
            const allOn = cats.every(c => prev.has(c))
            const next  = new Set(prev)
            if (allOn) cats.forEach(c => next.delete(c))
            else cats.forEach(c => next.add(c))
            return next
        })
    }, [])

    const toggleDataLayer = useCallback((layer: keyof DataLayers) => {
        setDataLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
    }, [])

    const handlePoiSelect = useCallback((poi: MapPoi | null) => {
        setSelectedPoi(poi)
    }, [])

    const handleQuestSelect = useCallback((q: MergedQuest | null) => {
        setSelectedQuestName(q?.name ?? null)
    }, [])

    const handleFallback = useCallback(() => setTileFallback(true), [])

    // ── Guards ─────────────────────────────────────────────────────────────────
    if (!map.tileConfig) {
        return (
            <div className="rf-card rounded-2xl flex items-center justify-center h-64 text-white/25 text-sm">
                No tile data for {map.displayName}.
            </div>
        )
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="rf-card rounded-2xl overflow-hidden flex flex-col">

            {/* ── Attribution header ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-2
                            border-b border-white/5 bg-white/[0.015]">
                <div className="flex items-center gap-2">
                    {/* Map icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                         strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-white/25 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                    </svg>
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                        Interactive Map
                    </span>
                </div>
                <span className="text-[10px] text-white/20">
                    Adapted with permission from{' '}
                    <a
                        href={tcnoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/35 hover:text-rf-blue/70 transition-colors underline underline-offset-2"
                    >
                        maps.tcno.co
                    </a>
                </span>
            </div>

            {/* ── Toolbar ─────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5
                            bg-white/[0.02] flex-wrap min-h-[46px]">

                {/* Difficulty chips */}
                <div className="flex items-center gap-1 flex-wrap">
                    {difficulties.map(d => {
                        const active = d.id === difficulty
                        return (
                            <button
                                key={d.id}
                                type="button"
                                onClick={() => setDifficulty(d.id)}
                                className={`text-[10px] font-semibold uppercase tracking-wider
                                            rounded-full px-2.5 py-1 border transition-all whitespace-nowrap ${
                                    active
                                        ? 'border-current'
                                        : 'border-white/10 text-white/30 hover:text-white/55 hover:border-white/20'
                                }`}
                                style={active && d.color
                                    ? { color: d.color, borderColor: d.color + '50', backgroundColor: d.color + '18' }
                                    : active
                                    ? { color: '#f9fafb', borderColor: 'rgba(249,250,251,0.35)', backgroundColor: 'rgba(249,250,251,0.08)' }
                                    : {}}
                            >
                                {d.label}
                            </button>
                        )
                    })}
                </div>

                {/* Floor selector — multi-floor maps only */}
                {isMultiFloor && map.floors && (
                    <div className="flex items-center gap-1 pl-2 border-l border-white/10 flex-wrap">
                        {map.floors.map((floor, i) => (
                            <button
                                key={floor.id}
                                type="button"
                                onClick={() => setActiveFloor(i)}
                                className={`text-[10px] font-medium rounded-full px-2 py-0.5 border transition-all ${
                                    activeFloor === i
                                        ? 'border-rf-orange/40 bg-rf-orange/12 text-rf-orange'
                                        : 'border-white/10 text-white/30 hover:text-white/55'
                                }`}
                            >
                                {floor.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Search */}
                <div className="flex-1 min-w-[120px] relative">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                         strokeWidth={2} stroke="currentColor"
                         className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/25 pointer-events-none">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                        ref={searchRef}
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search markers…"
                        className="w-full pl-6 pr-3 py-1 text-[11px] bg-white/[0.04] border border-white/8
                                   rounded-full text-white placeholder-white/20
                                   focus:outline-none focus:border-white/20 focus:bg-white/[0.06]
                                   transition-all"
                    />
                </div>

                {/* Layers panel toggle */}
                <button
                    type="button"
                    onClick={() => setShowPanel(v => !v)}
                    aria-label={showPanel ? 'Close layer panel' : 'Open layer panel'}
                    className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase
                                tracking-wider rounded-full px-2.5 py-1 border transition-all shrink-0 ${
                        showPanel
                            ? 'border-rf-orange/40 bg-rf-orange/12 text-rf-orange'
                            : 'border-white/10 text-white/30 hover:text-white/55 hover:border-white/20'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                         strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M12 3v1.5M12 19.5V21M4.219 4.219l1.061 1.061M17.72 17.72l1.06 1.06M3 12H4.5M19.5 12H21M4.219 19.781l1.061-1.06M17.72 6.28l1.06-1.061" />
                    </svg>
                    Layers
                    {/* Active category count badge */}
                    <span className="ml-0.5 bg-current/20 rounded-full px-1 py-px text-[9px]">
                        {activeCategories.size}
                    </span>
                </button>
            </div>

            {/* ── Map area ────────────────────────────────────────────────────── */}
            <div className="relative flex-1" style={{ height: 'min(70vh, 740px)' }}>

                {/* ── Category / layer panel ──────────────────────── */}
                {showPanel && (
                    <div
                        className="absolute top-0 right-0 bottom-0 z-[650] flex flex-col
                                   w-56 bg-rf-bg/96 backdrop-blur-xl border-l border-white/8
                                   overflow-y-auto overscroll-contain shadow-2xl"
                        style={{ animation: 'rf-slide-in-right 0.18s ease' }}
                    >
                        {/* Panel header */}
                        <div className="flex items-center justify-between px-4 pt-3 pb-2
                                        border-b border-white/5 sticky top-0 bg-rf-bg/98 backdrop-blur-xl z-10">
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
                                Map Layers
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowPanel(false)}
                                className="text-white/30 hover:text-white/60 transition-colors p-0.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                     strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* POI category groups */}
                        {CATEGORY_GROUPS.map(group => {
                            const allOn = group.categories.every(c => activeCategories.has(c))
                            return (
                                <div key={group.id} className="px-2 pt-3 pb-1">
                                    {/* Group header with "all on" toggle */}
                                    <button
                                        type="button"
                                        onClick={() => toggleAllInGroup(group.categories)}
                                        className="w-full flex items-center justify-between px-2 py-1
                                                   rounded-lg hover:bg-white/5 transition-colors group"
                                    >
                                        <span className="text-[9px] uppercase tracking-widest text-white/35 font-semibold">
                                            {group.label}
                                        </span>
                                        <span className={`text-[8px] font-bold uppercase tracking-wider
                                                          rounded-full px-1.5 py-0.5 transition-all ${
                                            allOn
                                                ? 'bg-white/10 text-white/45'
                                                : 'bg-white/5 text-white/20 group-hover:text-white/35'
                                        }`}>
                                            {allOn ? 'All' : 'Off'}
                                        </span>
                                    </button>

                                    {/* Category rows */}
                                    {group.categories.map(cat => {
                                        const meta   = POI_CATEGORY_META[cat]
                                        const active = activeCategories.has(cat)
                                        const count  = poiCountByCategory[cat] ?? 0
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => toggleCategory(cat)}
                                                className={`w-full flex items-center gap-2.5 px-2 py-1.5
                                                             rounded-lg transition-all text-left ${
                                                    active
                                                        ? 'hover:bg-white/5'
                                                        : 'opacity-45 hover:opacity-70 hover:bg-white/3'
                                                }`}
                                            >
                                                {/* Color swatch */}
                                                <span
                                                    className="w-2.5 h-2.5 rounded-sm shrink-0 border border-black/20"
                                                    style={{ background: active ? meta.color : '#4b5563' }}
                                                />
                                                <span className={`text-[11px] font-medium flex-1 leading-none ${
                                                    active ? 'text-white/80' : 'text-white/35'
                                                }`}>
                                                    {meta.label}
                                                </span>
                                                {count > 0 && (
                                                    <span className="text-[9px] text-white/25 tabular-nums">
                                                        {count}
                                                    </span>
                                                )}
                                                {/* Active indicator */}
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                                    active ? 'bg-white/30' : 'bg-white/8'
                                                }`} />
                                            </button>
                                        )
                                    })}
                                </div>
                            )
                        })}

                        {/* Divider */}
                        <div className="mx-4 my-2 border-t border-white/5" />

                        {/* Data layers */}
                        <div className="px-2 pb-3">
                            <span className="text-[9px] uppercase tracking-widest text-white/35 font-semibold px-2 block mb-1">
                                Data Layers
                            </span>

                            {/* Quests */}
                            <DataLayerRow
                                label="Quest Markers"
                                sublabel="MetaForge"
                                color="#8b95fa"
                                active={dataLayers.quests}
                                count={dataLayers.quests ? mapQuests.length : 0}
                                onToggle={() => toggleDataLayer('quests')}
                                iconPath="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                            />

                            {/* Container markers */}
                            <DataLayerRow
                                label="Container Markers"
                                sublabel="Curated"
                                color="#fb923c"
                                active={dataLayers.containers}
                                count={dataLayers.containers ? (CONTAINERS_BY_MAP[map.id]?.length ?? 0) : 0}
                                onToggle={() => toggleDataLayer('containers')}
                                iconPath="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                            />

                            {/* Loot areas */}
                            <DataLayerRow
                                label="Loot Zones"
                                sublabel="MetaForge"
                                color="#facc15"
                                active={dataLayers.lootAreas}
                                count={dataLayers.lootAreas ? mfLootAreas.length : 0}
                                onToggle={() => toggleDataLayer('lootAreas')}
                                disabled={mfLootAreas.length === 0}
                                iconPath="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                            />
                        </div>
                    </div>
                )}

                {/* ── No-results search overlay ───────────────────── */}
                {search.trim() && filteredPois.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-[600] pointer-events-none">
                        <div className="bg-black/75 backdrop-blur-sm rounded-2xl px-6 py-4 text-center">
                            <p className="text-sm text-white/55">
                                No pins match <span className="text-white/80 font-medium">"{search}"</span>
                            </p>
                            <p className="text-[11px] text-white/25 mt-1">
                                Try broadening your search or enabling more categories
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Tile fallback ───────────────────────────────── */}
                {tileFallback ? (
                    <MapStaticFallback map={map} />
                ) : (
                    <MapTileViewer
                        tileConfig={map.tileConfig}
                        activeLayerIndex={activeFloor}
                        onFallback={handleFallback}
                        quests={activeQuests}
                        allQuests={mapQuests}
                        selectedQuestName={selectedQuestName}
                        rfMapId={map.id}
                        onQuestSelect={handleQuestSelect}
                        containers={containers}
                        selectedContainerId={null}
                        lootAreas={lootAreas}
                        selectedLootAreaId={null}
                        pois={filteredPois}
                        selectedPoiId={selectedPoi?.id ?? null}
                        onPoiSelect={handlePoiSelect}
                        fillContainer
                    />
                )}

                {/* ── Selected POI detail panel ───────────────────── */}
                {selectedPoi && (
                    <div
                        className="absolute bottom-0 left-0 right-0 z-[640]
                                   bg-rf-bg/94 backdrop-blur-xl border-t border-white/10
                                   px-4 py-3 flex items-start gap-3"
                        style={{ animation: 'none' }}
                    >
                        {/* Category swatch */}
                        <span
                            className="mt-0.5 w-3 h-3 rounded-sm shrink-0"
                            style={{ background: POI_CATEGORY_META[selectedPoi.category].color }}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-white leading-tight">
                                    {selectedPoi.name}
                                </span>
                                <span className="text-[10px] font-medium uppercase tracking-wider"
                                      style={{ color: POI_CATEGORY_META[selectedPoi.category].color }}>
                                    {POI_CATEGORY_META[selectedPoi.category].label}
                                </span>
                            </div>
                            {selectedPoi.description && (
                                <p className="text-[11px] text-white/45 mt-1 leading-relaxed line-clamp-2">
                                    {selectedPoi.description}
                                </p>
                            )}
                            {selectedPoi.difficulties && (
                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                    {selectedPoi.difficulties.map(d => (
                                        <span key={d}
                                              className="text-[9px] border border-white/10 text-white/30
                                                         rounded-full px-1.5 py-px">
                                            {d}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedPoi(null)}
                            className="text-white/25 hover:text-white/60 transition-colors shrink-0 mt-0.5"
                            aria-label="Dismiss"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                 strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* ── Status bar ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 px-4 py-1.5
                            border-t border-white/5 bg-white/[0.01] flex-wrap">
                <span className="text-[10px] text-white/20">
                    {filteredPois.length} pin{filteredPois.length !== 1 ? 's' : ''} visible
                    {search.trim() && <> matching <em className="not-italic text-white/35">"{search}"</em></>}
                </span>
                <span className="text-[10px] text-white/15">
                    {difficulty !== 'Normal' && (
                        <span className="mr-2 text-white/25">{difficulty} mode</span>
                    )}
                    Interactive map tiles © ardb.app
                </span>
            </div>
        </div>
    )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function DataLayerRow({
    label,
    sublabel,
    color,
    active,
    count,
    onToggle,
    disabled,
    iconPath,
}: {
    label: string
    sublabel: string
    color: string
    active: boolean
    count: number
    onToggle: () => void
    disabled?: boolean
    iconPath: string
}) {
    return (
        <button
            type="button"
            onClick={disabled ? undefined : onToggle}
            disabled={disabled}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-all ${
                disabled
                    ? 'opacity-25 cursor-not-allowed'
                    : active
                    ? 'hover:bg-white/5'
                    : 'opacity-45 hover:opacity-65 hover:bg-white/3'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 strokeWidth={1.5} stroke="currentColor"
                 className="w-3 h-3 shrink-0"
                 style={{ color: active ? color : '#6b7280' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
            </svg>
            <div className="flex-1 min-w-0">
                <div className={`text-[11px] font-medium leading-none ${
                    active ? 'text-white/80' : 'text-white/35'
                }`}>
                    {label}
                </div>
                <div className="text-[9px] text-white/20 mt-0.5">{sublabel}</div>
            </div>
            {count > 0 && (
                <span className="text-[9px] text-white/25 tabular-nums">{count}</span>
            )}
            {disabled && (
                <span className="text-[9px] text-white/20 italic">—</span>
            )}
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                active && !disabled ? 'bg-white/30' : 'bg-white/8'
            }`} />
        </button>
    )
}

function MapStaticFallback({ map }: { map: MapMeta }) {
    const img = map.image ?? map.floors?.[0]?.image
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-rf-bg gap-3">
            {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={map.displayName} className="max-h-full max-w-full object-contain opacity-40" />
            ) : (
                <div className="text-white/20 text-sm">Map tiles unavailable</div>
            )}
            <p className="text-[11px] text-white/25 absolute bottom-4">
                Tile stream unavailable — showing static reference
            </p>
        </div>
    )
}
