'use client'

/**
 * NativeMapExplorer — RaiderForge-native interactive map shell.
 *
 * Wraps MapTileViewer with TCNO-inspired controls: difficulty selector,
 * grouped category panel, inline search, and floor tabs. All styling is
 * RaiderForge-native — no TCNO chrome.
 *
 * Adding a new map: supply the correct `map` prop. No per-map rewrites needed.
 * Difficulty options and category groups are data-driven via map-interactive-config.ts.
 */

import { useState, useMemo, useCallback, useRef, Fragment } from 'react'
import dynamic from 'next/dynamic'
import type { MapMeta } from '@/data/maps'
import type { MergedQuest } from '@/types/quests'
import type { LootAreaMarker } from '@/types/mapLayers'
import type { MapPoi, PoiCategory, Difficulty } from '@/lib/maps/poi-types'
import {
    getPoisForMap,
    filterPoisByCategories,
    filterPoisForFloor,
} from '@/lib/maps/pois'
import { getDifficultiesForMap, CATEGORY_GROUPS, DEFAULT_ACTIVE_CATEGORIES } from '@/lib/maps/map-interactive-config'
import { POI_CATEGORY_META } from '@/components/maps/MapPoiMarker'
import { CONTAINERS_BY_MAP } from '@/data/containers'

const MapTileViewer = dynamic(() => import('@/components/MapTileViewer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-rf-bg flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-5 h-5 border-2 border-rf-orange/30 border-t-rf-orange rounded-full animate-spin" />
                <span className="text-[10px] text-white/20 uppercase tracking-widest font-medium">
                    Loading map…
                </span>
            </div>
        </div>
    ),
})

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
    map: MapMeta
    mapQuests?: MergedQuest[]
    mfLootAreas?: LootAreaMarker[]
}

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
    const [difficulty, setDifficulty]         = useState<Difficulty>('Normal')
    const [search, setSearch]                 = useState('')
    const [activeFloor, setActiveFloor]       = useState(0)
    const [showPanel, setShowPanel]           = useState(false)
    const [selectedPoi, setSelectedPoi]       = useState<MapPoi | null>(null)
    const [selectedQuestName, setSelectedQuestName] = useState<string | null>(null)
    const [tileFallback, setTileFallback]     = useState(false)

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
    const allPois      = useMemo(() => getPoisForMap(map.id), [map.id])
    const difficulties = useMemo(() => getDifficultiesForMap(map.id), [map.id])
    const isMultiFloor = map.mapType === 'multi-floor' && (map.floors?.length ?? 0) > 1

    // Pins that pass difficulty + search + floor — used for counts (ignores active category filter)
    const eligiblePois = useMemo(() => {
        let pois = filterPoisForFloor(allPois, activeFloor)
        if (difficulty !== 'Normal') {
            pois = pois.filter(p => !p.difficulties || p.difficulties.includes(difficulty))
        }
        const q = search.trim().toLowerCase()
        if (q) {
            pois = pois.filter(
                p => p.name.toLowerCase().includes(q) ||
                     p.description?.toLowerCase().includes(q),
            )
        }
        return pois
    }, [allPois, activeFloor, difficulty, search])

    // Visible pins on the map (adds active-category filter)
    const filteredPois = useMemo(
        () => filterPoisByCategories(eligiblePois, activeCategories),
        [eligiblePois, activeCategories],
    )

    // Count per category from eligiblePois (shows what you'd get if you enable it)
    const countByCategory = useMemo(() => {
        const c: Partial<Record<PoiCategory, number>> = {}
        for (const p of eligiblePois) c[p.category] = (c[p.category] ?? 0) + 1
        return c
    }, [eligiblePois])

    const containers   = useMemo(
        () => (dataLayers.containers ? (CONTAINERS_BY_MAP[map.id] ?? []) : []),
        [dataLayers.containers, map.id],
    )
    const lootAreas    = dataLayers.lootAreas ? mfLootAreas : []
    const activeQuests = dataLayers.quests    ? mapQuests   : []

    // ── Callbacks ──────────────────────────────────────────────────────────────
    const toggleCategory = useCallback((cat: PoiCategory) => {
        setActiveCategories(prev => {
            const next = new Set(prev)
            if (next.has(cat)) next.delete(cat)
            else next.add(cat)
            return next
        })
    }, [])

    const toggleGroup = useCallback((cats: PoiCategory[]) => {
        setActiveCategories(prev => {
            const allOn = cats.every(c => prev.has(c))
            const next  = new Set(prev)
            if (allOn) cats.forEach(c => next.delete(c))
            else cats.forEach(c => next.add(c))
            return next
        })
    }, [])

    const resetCategories = useCallback(() => {
        setActiveCategories(new Set(DEFAULT_ACTIVE_CATEGORIES))
    }, [])

    const toggleDataLayer = useCallback((layer: keyof DataLayers) => {
        setDataLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
    }, [])

    const handlePoiSelect    = useCallback((poi: MapPoi | null) => setSelectedPoi(poi), [])
    const handleQuestSelect  = useCallback((q: MergedQuest | null) => setSelectedQuestName(q?.name ?? null), [])
    const handleFallback     = useCallback(() => setTileFallback(true), [])

    // ── Guard ──────────────────────────────────────────────────────────────────
    if (!map.tileConfig) {
        return (
            <div className="rf-card rounded-2xl h-64 flex items-center justify-center
                            text-white/20 text-sm tracking-wide">
                No tile data for {map.displayName}.
            </div>
        )
    }

    const isDefaultState = (() => {
        const def = new Set(DEFAULT_ACTIVE_CATEGORIES)
        return (
            difficulty === 'Normal' &&
            !search.trim() &&
            activeCategories.size === def.size &&
            [...def].every(c => activeCategories.has(c))
        )
    })()

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="rf-card rounded-2xl overflow-hidden flex flex-col">

            {/* ── Attribution strip ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-[7px]
                            border-b border-white/[0.045] bg-white/[0.012]">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                         strokeWidth={1.5} stroke="currentColor"
                         className="w-3 h-3 text-white/20 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                    </svg>
                    <span className="text-[10px] uppercase tracking-widest text-white/25 font-semibold">
                        Interactive Map
                    </span>
                </div>
                <span className="text-[10px] text-white/18">Hosted natively on RaiderForge</span>
            </div>

            {/* ── Pin legend (curated POIs + layer hints) ───────────────────── */}
            <div className="px-3 py-2 border-b border-white/[0.045] bg-white/[0.014]">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <span className="text-[9px] uppercase tracking-widest text-white/28 font-semibold w-full sm:w-auto sm:mr-1">
                        Pin legend
                    </span>
                    {(Object.keys(POI_CATEGORY_META) as PoiCategory[]).map((cat) => {
                        const meta = POI_CATEGORY_META[cat]
                        return (
                            <span
                                key={cat}
                                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-black/30 border border-white/[0.06]"
                                title={`Curated pin: ${meta.label}`}
                            >
                                <span
                                    className="w-2 h-2 rounded-sm shrink-0"
                                    style={{ background: meta.color }}
                                />
                                <span className="text-[9px] text-white/55 font-medium">{meta.label}</span>
                            </span>
                        )
                    })}
                </div>
                <p className="mt-1.5 text-[9px] text-white/22 leading-snug">
                    Toggle categories in <span className="text-white/35">Filters</span>. Data layers add quest markers,
                    container diamonds, and loot zones on the tactical grid.
                </p>
            </div>

            {/* ── Primary toolbar ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-3 py-2
                            border-b border-white/[0.045] bg-white/[0.018]">

                {/* Difficulty row — scrollable, no wrap */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0 shrink">
                    {difficulties.map((d, i) => {
                        const isActive = d.id === difficulty
                        // Thin separator before the first non-Normal mode
                        const showSep = i === 1 && difficulties.length > 1
                        return (
                            <Fragment key={d.id}>
                                {showSep && (
                                    <span
                                        className="h-3.5 w-px shrink-0 bg-white/12 mx-0.5"
                                        aria-hidden
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => setDifficulty(d.id)}
                                    className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider
                                                rounded-full px-2.5 py-[3px] border transition-all whitespace-nowrap ${
                                        isActive
                                            ? 'border-current'
                                            : 'border-white/10 text-white/28 hover:text-white/52 hover:border-white/18'
                                    }`}
                                    style={
                                        isActive
                                            ? d.color
                                                ? {
                                                    color:           d.color,
                                                    borderColor:     d.color + '4a',
                                                    backgroundColor: d.color + '16',
                                                }
                                                : {
                                                    color:           'rgba(249,250,251,0.88)',
                                                    borderColor:     'rgba(249,250,251,0.28)',
                                                    backgroundColor: 'rgba(249,250,251,0.07)',
                                                }
                                            : {}
                                    }
                                >
                                    {d.label}
                                </button>
                            </Fragment>
                        )
                    })}
                </div>

                {/* Push search + layers to the right */}
                <div className="ml-auto flex items-center gap-2 shrink-0">

                    {/* Search */}
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                             strokeWidth={2} stroke="currentColor"
                             className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3
                                        text-white/22 pointer-events-none">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                        <input
                            ref={searchRef}
                            type="search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search pins…"
                            className="w-36 pl-7 pr-7 py-[5px] text-[11px]
                                       bg-white/[0.04] border border-white/8 rounded-full
                                       text-white/85 placeholder-white/20
                                       focus:outline-none focus:border-white/18 focus:bg-white/[0.06]
                                       transition-all [&::-webkit-search-cancel-button]:hidden"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => { setSearch(''); searchRef.current?.focus() }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2
                                           text-white/25 hover:text-white/55 transition-colors"
                                aria-label="Clear search"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                     strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Layers / filters button */}
                    <button
                        type="button"
                        onClick={() => setShowPanel(v => !v)}
                        aria-label={showPanel ? 'Close layer panel' : 'Open layer panel'}
                        className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase
                                    tracking-wider rounded-full px-2.5 py-[5px] border
                                    transition-all whitespace-nowrap ${
                            showPanel
                                ? 'border-rf-orange/40 bg-rf-orange/12 text-rf-orange'
                                : 'border-white/10 text-white/32 hover:text-white/55 hover:border-white/18'
                        }`}
                    >
                        {/* Heroicons adjustments-horizontal */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                             strokeWidth={2} stroke="currentColor" className="w-3 h-3 shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                        </svg>
                        Filters
                        <span className={`inline-flex items-center justify-center
                                          min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold
                                          transition-colors ${
                            showPanel
                                ? 'bg-rf-orange/20 text-rf-orange'
                                : 'bg-white/10 text-white/45'
                        }`}>
                            {activeCategories.size}
                        </span>
                    </button>
                </div>
            </div>

            {/* ── Floor selector (multi-floor only) ───────────────────────────── */}
            {isMultiFloor && map.floors && (
                <div className="flex items-center gap-1 px-3 py-1.5
                                border-b border-white/[0.045] bg-white/[0.012]">
                    <span className="text-[9px] uppercase tracking-widest text-white/20 font-medium mr-1.5">
                        Floor
                    </span>
                    {map.floors.map((floor, i) => (
                        <button
                            key={floor.id}
                            type="button"
                            onClick={() => setActiveFloor(i)}
                            className={`text-[10px] font-medium rounded-md px-2 py-0.5 border transition-all ${
                                activeFloor === i
                                    ? 'border-rf-orange/40 bg-rf-orange/12 text-rf-orange'
                                    : 'border-white/8 text-white/28 hover:text-white/55 hover:border-white/18'
                            }`}
                        >
                            {floor.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Map area ────────────────────────────────────────────────────── */}
            <div className="relative flex-1" style={{ height: 'min(70vh, 740px)' }}>

                {/* ── Layer / category panel ──────────────────────── */}
                {showPanel && (
                    <div
                        className="rf-panel-enter absolute top-0 right-0 bottom-0 z-[650]
                                   flex flex-col w-60
                                   bg-[rgba(5,6,10,0.97)] backdrop-blur-xl
                                   border-l border-white/[0.07] shadow-2xl
                                   overflow-y-auto overscroll-contain"
                    >
                        {/* Panel header */}
                        <div className="flex items-center justify-between px-4 pt-3 pb-2.5
                                        border-b border-white/[0.06]
                                        sticky top-0 z-10
                                        bg-[rgba(5,6,10,0.99)] backdrop-blur-xl">
                            <span className="text-[10px] uppercase tracking-widest
                                             text-white/40 font-semibold">
                                Map Layers
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowPanel(false)}
                                className="text-white/25 hover:text-white/65 transition-colors p-0.5 -mr-0.5"
                                aria-label="Close panel"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                     viewBox="0 0 24 24" strokeWidth={2.5}
                                     stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* POI pin groups */}
                        <div className="px-3 pt-2.5 pb-1 flex-1">
                            {CATEGORY_GROUPS.map(group => {
                                const activeInGroup = group.categories.filter(c =>
                                    activeCategories.has(c),
                                ).length
                                const allOn  = activeInGroup === group.categories.length
                                const noneOn = activeInGroup === 0

                                return (
                                    <div key={group.id} className="mb-4">
                                        {/* Group header */}
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(group.categories)}
                                            className="group w-full flex items-center gap-2 mb-1
                                                       py-0.5 rounded transition-colors hover:bg-white/4"
                                        >
                                            {/* State indicator: mini swatches */}
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                {group.categories.slice(0, 4).map(c => (
                                                    <span
                                                        key={c}
                                                        className="w-1.5 h-1.5 rounded-full transition-all"
                                                        style={{
                                                            background: activeCategories.has(c)
                                                                ? POI_CATEGORY_META[c].color
                                                                : 'rgba(255,255,255,0.08)',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <span className={`text-[9px] uppercase tracking-widest
                                                              font-semibold transition-colors ${
                                                allOn
                                                    ? 'text-white/55'
                                                    : noneOn
                                                    ? 'text-white/22'
                                                    : 'text-white/38'
                                            }`}>
                                                {group.label}
                                            </span>
                                            <span className={`ml-auto text-[8px] font-bold uppercase
                                                              tracking-wider rounded px-1 py-px
                                                              transition-all shrink-0 ${
                                                allOn
                                                    ? 'text-white/45 bg-white/8'
                                                    : noneOn
                                                    ? 'text-white/18 bg-white/4 group-hover:text-white/32'
                                                    : 'text-white/35 bg-white/6'
                                            }`}>
                                                {allOn ? 'all' : noneOn ? 'off' : `${activeInGroup}/${group.categories.length}`}
                                            </span>
                                        </button>

                                        {/* Category rows */}
                                        {group.categories.map(cat => {
                                            const meta   = POI_CATEGORY_META[cat]
                                            const active = activeCategories.has(cat)
                                            const count  = countByCategory[cat] ?? 0
                                            return (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => toggleCategory(cat)}
                                                    className={`w-full flex items-center gap-2 py-[5px] pl-2 pr-2
                                                                 rounded transition-all text-left
                                                                 border-l-2 ${
                                                        active
                                                            ? 'hover:bg-white/[0.04]'
                                                            : 'opacity-50 hover:opacity-75 hover:bg-white/[0.025]'
                                                    }`}
                                                    style={
                                                        active
                                                            ? { borderLeftColor: meta.color }
                                                            : { borderLeftColor: 'rgba(255,255,255,0.06)' }
                                                    }
                                                >
                                                    <span
                                                        className="w-2 h-2 rounded-sm shrink-0"
                                                        style={{
                                                            background: active ? meta.color : 'rgba(255,255,255,0.12)',
                                                        }}
                                                    />
                                                    <span className={`text-[11px] font-medium flex-1
                                                                       leading-none min-w-0 truncate ${
                                                        active ? 'text-white/82' : 'text-white/32'
                                                    }`}>
                                                        {meta.label}
                                                    </span>
                                                    <span className={`text-[10px] tabular-nums shrink-0 ${
                                                        count > 0
                                                            ? active ? 'text-white/35' : 'text-white/18'
                                                            : 'text-white/12'
                                                    }`}>
                                                        {count || '–'}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )
                            })}

                            {/* ── Data layers ── */}
                            <div className="border-t border-white/[0.06] pt-3 pb-1">
                                <span className="text-[9px] uppercase tracking-widest
                                                 text-white/25 font-semibold block mb-2 px-2">
                                    Data Layers
                                </span>

                                <DataLayerRow
                                    label="Quest Markers"
                                    sublabel="MetaForge"
                                    color="#8b95fa"
                                    active={dataLayers.quests}
                                    count={dataLayers.quests ? mapQuests.length : 0}
                                    onToggle={() => toggleDataLayer('quests')}
                                    iconPath="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                                />
                                <DataLayerRow
                                    label="Container Markers"
                                    sublabel="Curated"
                                    color="#fb923c"
                                    active={dataLayers.containers}
                                    count={dataLayers.containers ? (CONTAINERS_BY_MAP[map.id]?.length ?? 0) : 0}
                                    onToggle={() => toggleDataLayer('containers')}
                                    iconPath="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                                />
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

                        {/* ── Panel footer ── */}
                        {!isDefaultState && (
                            <div className="sticky bottom-0 px-3 pb-3 pt-2
                                            bg-[rgba(5,6,10,0.97)] border-t border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetCategories()
                                        setDifficulty('Normal')
                                        setSearch('')
                                    }}
                                    className="w-full text-[10px] font-medium text-white/30
                                               hover:text-white/60 border border-white/8
                                               hover:border-white/18 rounded-lg py-1.5
                                               transition-all text-center"
                                >
                                    Reset to defaults
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── No-results overlay ──────────────────────────── */}
                {search.trim() && filteredPois.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center
                                    z-[600] pointer-events-none">
                        <div className="bg-black/78 backdrop-blur-sm rounded-2xl
                                        px-7 py-5 text-center max-w-xs">
                            <p className="text-sm font-medium text-white/60">
                                No pins match{' '}
                                <span className="text-white/85">"{search}"</span>
                            </p>
                            <p className="text-[11px] text-white/25 mt-1.5 leading-relaxed">
                                Enable more categories or broaden your search
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Tile viewer / fallback ──────────────────────── */}
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

                {/* ── Selected POI detail ─────────────────────────── */}
                {selectedPoi && (
                    <PoiDetailPanel
                        poi={selectedPoi}
                        onDismiss={() => setSelectedPoi(null)}
                    />
                )}
            </div>

            {/* ── Status bar ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-2 px-4 py-[5px]
                            border-t border-white/[0.04] bg-white/[0.009] flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/22">
                        {filteredPois.length
                            ? <>{filteredPois.length} pin{filteredPois.length !== 1 ? 's' : ''} visible</>
                            : <span className="text-white/16">No pins visible</span>}
                    </span>
                    {search.trim() && (
                        <span className="text-[10px] text-white/18">
                            matching <em className="not-italic text-white/32">"{search}"</em>
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {difficulty !== 'Normal' && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider
                                         border border-white/10 rounded-full px-2 py-px text-white/30">
                            {difficulty}
                        </span>
                    )}
                    <span className="text-[10px] text-white/14">
                        Tiles © ardb.app
                    </span>
                </div>
            </div>
        </div>
    )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PoiDetailPanel({
    poi,
    onDismiss,
}: {
    poi: MapPoi
    onDismiss: () => void
}) {
    const meta = POI_CATEGORY_META[poi.category]
    return (
        <div
            className="rf-badge-enter absolute bottom-0 left-0 right-0 z-[640]
                       flex items-stretch
                       bg-[rgba(5,6,10,0.95)] backdrop-blur-xl
                       border-t border-white/[0.08]"
        >
            {/* Left accent bar */}
            <div
                className="w-[3px] shrink-0 rounded-tr-sm rounded-br-sm"
                style={{ background: meta.color }}
            />

            <div className="flex-1 min-w-0 px-4 py-3">
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        {/* Category label */}
                        <span
                            className="text-[9px] font-bold uppercase tracking-widest mb-1 block"
                            style={{ color: meta.color }}
                        >
                            {meta.label}
                        </span>
                        {/* Name */}
                        <p className="text-sm font-semibold text-white leading-snug">
                            {poi.name}
                        </p>
                        {/* Description */}
                        {poi.description && (
                            <p className="text-[11px] text-white/42 mt-1.5 leading-relaxed">
                                {poi.description}
                            </p>
                        )}
                        {/* Difficulty tags */}
                        {poi.difficulties && poi.difficulties.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                                {poi.difficulties.map(d => (
                                    <span
                                        key={d}
                                        className="text-[9px] border border-white/10
                                                   text-white/28 rounded-full px-1.5 py-px"
                                    >
                                        {d}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Dismiss */}
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="text-white/22 hover:text-white/58 transition-colors
                                   shrink-0 mt-0.5 p-0.5"
                        aria-label="Dismiss"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                             strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

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
            className={`w-full flex items-center gap-2 pl-2 pr-2 py-[5px] rounded
                        text-left transition-all border-l-2 ${
                disabled
                    ? 'opacity-20 cursor-not-allowed border-white/5'
                    : active
                    ? 'hover:bg-white/[0.04]'
                    : 'opacity-45 hover:opacity-68 hover:bg-white/[0.025] border-white/6'
            }`}
            style={!disabled && active ? { borderLeftColor: color } : undefined}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 strokeWidth={1.5} stroke="currentColor"
                 className="w-3 h-3 shrink-0"
                 style={{ color: active && !disabled ? color : 'rgba(156,163,175,0.4)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
            </svg>
            <div className="flex-1 min-w-0">
                <div className={`text-[11px] font-medium leading-none truncate ${
                    active && !disabled ? 'text-white/80' : 'text-white/32'
                }`}>
                    {label}
                </div>
                <div className="text-[9px] text-white/18 mt-0.5">{sublabel}</div>
            </div>
            <span className={`text-[10px] tabular-nums shrink-0 ${
                disabled ? 'text-white/15 italic' : count > 0 ? 'text-white/28' : 'text-white/12'
            }`}>
                {disabled ? '—' : count || '–'}
            </span>
        </button>
    )
}

function MapStaticFallback({ map }: { map: MapMeta }) {
    const img = map.coverImage ?? map.image ?? map.floors?.[0]?.image
    return (
        <div className="w-full h-full flex items-center justify-center bg-rf-bg">
            {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={img}
                    alt={`${map.displayName} — static map reference while tiles are unavailable`}
                    className="max-h-full max-w-full object-contain opacity-35"
                />
            ) : (
                <span className="text-white/18 text-sm">Map tiles unavailable</span>
            )}
            <p className="text-[11px] text-white/22 absolute bottom-4 left-0 right-0 text-center">
                Tile stream unavailable — showing static reference
            </p>
        </div>
    )
}
