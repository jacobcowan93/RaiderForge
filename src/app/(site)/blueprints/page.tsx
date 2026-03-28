'use client'

import { BlueprintCard } from './BlueprintCard'
import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'
import { ARDB_CATALOG_ATTRIBUTION } from '@/lib/marketplace/catalog-types'
import { exportMissingBlueprintsAsJpeg } from '@/lib/blueprints/exportMissingJpeg'
import {
    loadBlueprintStates,
    saveBlueprintStates,
    type BlueprintTrackState,
} from '@/lib/blueprints/blueprintTrackingStorage'
import {
    blueprintsFromCatalogItems,
    collectFoundInTags,
    type NormalizedBlueprint,
} from '@/lib/blueprints/normalizeBlueprints'
import { groupBlueprintsByRarityTier } from '@/lib/blueprints/rarityGroups'
import { resolveBlueprintImage } from '@/lib/blueprints/resolveBlueprintImage'
import { formatRarityLabel, type RarityVisualTier } from '@/lib/blueprints/rarityCardStyles'
import {
    applyBlueprintSort,
    blueprintDisplayName,
    type SortMode,
} from '@/lib/blueprints/sortBlueprints'
import { warnIfAllowlistDriftFromGameOrder } from '@/lib/blueprints/blueprintInGameOrder'
import { mergeAllowlistMatchedBlueprints } from '@/lib/blueprints/blueprintAllowlistMerge'
import {
    getBlueprintAllowlistEntries,
    logSpreadsheetMatchStats,
    matchBlueprintsToAllowlist,
    type SpreadsheetMatchStats,
} from '@/lib/blueprints/blueprintSpreadsheetMatcher'
import { stripTrailingBlueprintSuffix } from '@/lib/blueprints/blueprintSlug'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

// Public route: tracker uses localStorage only (`raiderforge.blueprint-track.v1`); no sign-in wall.
type CatalogResponse = {
    syncedAt: string | null
    count: number
    attribution: typeof ARDB_CATALOG_ATTRIBUTION
    items: MarketplaceCatalogItem[]
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
    { value: 'ingame_asc', label: 'In-game order' },
    { value: 'sheet_asc', label: 'Spreadsheet order' },
    { value: 'rarity_desc', label: 'Rarity (high → low)' },
    { value: 'rarity_asc', label: 'Rarity (low → high)' },
    { value: 'name_asc', label: 'Name (A–Z)' },
    { value: 'name_desc', label: 'Name (Z–A)' },
]

const btnExport =
    'inline-flex items-center justify-center rounded-lg border border-white/15 bg-rf-bg/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rf-text hover:border-rf-red/40 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none'

const tierChipClass: Record<RarityVisualTier, string> = {
    legendary: 'text-rf-orange border-rf-orange/30 bg-rf-orange/10',
    epic: 'text-purple-200 border-purple-400/30 bg-purple-500/10',
    rare: 'text-sky-200 border-sky-400/30 bg-sky-500/10',
    uncommon: 'text-rf-green border-rf-green/30 bg-rf-green/10',
    common: 'text-rf-textSoft border-white/15 bg-white/5',
    unknown: 'text-rf-textSoft border-white/12 bg-white/[0.04]',
    none: 'text-rf-textSoft border-white/10 bg-white/[0.04]',
}

export default function BlueprintsPage() {
    const [catalogLoading, setCatalogLoading] = useState(true)
    const [catalogError, setCatalogError] = useState<string | null>(null)
    const [syncedAt, setSyncedAt] = useState<string | null>(null)
    const [blueprints, setBlueprints] = useState<NormalizedBlueprint[]>([])
    const [allowlistStats, setAllowlistStats] = useState<SpreadsheetMatchStats | null>(null)

    const [query, setQuery] = useState('')
    const [foundInFilter, setFoundInFilter] = useState<string>('__all__')
    const [sortMode, setSortMode] = useState<SortMode>('ingame_asc')
    const [onlyMissing, setOnlyMissing] = useState(false)
    const [quickToggleMode, setQuickToggleMode] = useState(false)

    const [trackMap, setTrackMap] = useState<Record<string, BlueprintTrackState>>({})
    const [storageReady, setStorageReady] = useState(false)
    const [jpegBusy, setJpegBusy] = useState(false)

    useEffect(() => {
        setTrackMap(loadBlueprintStates())
        setStorageReady(true)
    }, [])

    useEffect(() => {
        if (!storageReady) return
        saveBlueprintStates(trackMap)
    }, [trackMap, storageReady])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setCatalogLoading(true)
            setCatalogError(null)
            setAllowlistStats(null)
            try {
                const res = await fetch('/api/marketplace/catalog', { cache: 'no-store' })
                if (!res.ok) throw new Error(`Catalog request failed (${res.status})`)
                const data = (await res.json()) as CatalogResponse
                if (!cancelled && Array.isArray(data.items)) {
                    setSyncedAt(data.syncedAt ?? null)
                    const raw = blueprintsFromCatalogItems(data.items)
                    const { blueprints: matched, stats } = matchBlueprintsToAllowlist(raw)
                    logSpreadsheetMatchStats(stats)
                    const allowlistEntries = getBlueprintAllowlistEntries()
                    warnIfAllowlistDriftFromGameOrder(allowlistEntries.map((e) => e.name))
                    setAllowlistStats(stats)
                    setBlueprints(mergeAllowlistMatchedBlueprints(matched, allowlistEntries))
                }
            } catch (e) {
                if (!cancelled) setCatalogError(e instanceof Error ? e.message : 'Failed to load catalog')
            } finally {
                if (!cancelled) setCatalogLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const foundInOptions = useMemo(() => collectFoundInTags(blueprints), [blueprints])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        let list = blueprints
        if (onlyMissing) list = list.filter((b) => trackMap[b.id] !== 'owned')
        if (q) list = list.filter((b) => blueprintDisplayName(b).toLowerCase().includes(q))
        if (foundInFilter !== '__all__') {
            list = list.filter((b) => b.foundIn.includes(foundInFilter))
        }
        return applyBlueprintSort(list, sortMode)
    }, [blueprints, query, foundInFilter, sortMode, onlyMissing, trackMap])

    const missingBlueprints = useMemo(
        () => blueprints.filter((b) => trackMap[b.id] !== 'owned'),
        [blueprints, trackMap]
    )

    const missingByTier = useMemo(() => groupBlueprintsByRarityTier(missingBlueprints), [missingBlueprints])

    const printGroups = useMemo(() => {
        return groupBlueprintsByRarityTier(missingBlueprints).map((g) => ({
            ...g,
            items: [...g.items].sort((a, b) => blueprintDisplayName(a).localeCompare(blueprintDisplayName(b))),
        }))
    }, [missingBlueprints])

    const setOwned = useCallback((id: string, owned: boolean) => {
        setTrackMap((prev) => {
            if (owned) return { ...prev, [id]: 'owned' }
            const { [id]: _, ...rest } = prev
            return rest
        })
    }, [])

    const ownedCount = useMemo(() => blueprints.filter((b) => trackMap[b.id] === 'owned').length, [blueprints, trackMap])
    const total = blueprints.length
    const pct = total > 0 ? Math.round((ownedCount / total) * 100) : 0

    const handleExportJpeg = useCallback(async () => {
        setJpegBusy(true)
        try {
            await exportMissingBlueprintsAsJpeg(missingBlueprints, sortMode)
        } catch {
            window.alert('Could not export JPEG. Try print to PDF, or check the browser console.')
        } finally {
            setJpegBusy(false)
        }
    }, [missingBlueprints, sortMode])

    return (
        <div className="max-w-7xl mx-auto py-8 md:py-10 px-4 sm:px-5">
            <div className="print:hidden space-y-4 md:space-y-5">
                <header className="rf-card rounded-xl px-4 py-4 sm:px-5 border border-white/[0.06]">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 lg:gap-6">
                        <div className="min-w-0">
                            <span className="text-[10px] uppercase tracking-[0.22em] text-rf-textSoft font-semibold">
                                Loadout
                            </span>
                            <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">Blueprint tracker</h1>
                            <p className="mt-2 text-xs text-rf-textSoft max-w-2xl leading-relaxed">
                                List and type labels follow the ARC Raiders Blueprints spreadsheet (exported into this app).
                                Tiles use the reference tracker grid where available; ARDB URLs fill gaps. Hover or focus a
                                tile for description and found-in tags from ARDB. Saved locally on this device; no sign-in.
                            </p>
                            {allowlistStats && allowlistStats.unmatchedSheetNames.length > 0 ? (
                                <p className="mt-2 text-[10px] text-rf-orange/90 leading-relaxed max-w-2xl">
                                    {allowlistStats.unmatchedSheetNames.length} spreadsheet row
                                    {allowlistStats.unmatchedSheetNames.length === 1 ? ' has' : 's have'} no safe ARDB
                                    catalog match. Those entries still count toward the full collection and appear as tiles
                                    (title, checkbox, reference art when available). Hover notes when catalog metadata is
                                    missing. Names are logged in the browser dev console.
                                </p>
                            ) : null}
                            {syncedAt && (
                                <p className="mt-1.5 text-[10px] text-rf-textSoft/80">
                                    Catalog synced{' '}
                                    <time dateTime={syncedAt}>{new Date(syncedAt).toLocaleString()}</time>
                                </p>
                            )}
                        </div>
                        {!catalogLoading && !catalogError && blueprints.length > 0 ? (
                            <p className="shrink-0 text-sm font-semibold tabular-nums tracking-tight lg:text-right">
                                <span className="text-rf-textSoft uppercase text-[10px] tracking-widest block sm:inline sm:mr-2">
                                    Missing
                                </span>
                                <span className="text-white text-lg">{missingBlueprints.length}</span>
                                <span className="text-rf-textSoft text-xs font-normal ml-1">/ {total}</span>
                            </p>
                        ) : null}
                    </div>
                </header>

                {catalogLoading && (
                    <div className="rf-card rounded-xl px-4 py-8 overflow-hidden border border-white/[0.06]" aria-busy="true">
                        <div className="animate-pulse space-y-3">
                            <div className="h-6 bg-white/10 rounded w-40" />
                            <div className="h-3 bg-white/[0.06] rounded w-full max-w-sm" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-3.5 pt-3">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="rf-card rounded-lg aspect-[5/6] border border-white/5" />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {catalogError && (
                    <div className="rf-card rounded-xl px-6 py-10 text-center border border-rf-red/25">
                        <p className="text-rf-red font-medium">Could not load blueprints</p>
                        <p className="text-sm text-rf-textSoft mt-2">{catalogError}</p>
                    </div>
                )}

                {!catalogLoading && !catalogError && blueprints.length === 0 && (
                    <div className="rf-card rounded-xl px-6 py-10 text-center">
                        <p className="text-rf-text font-medium">No blueprint rows to show</p>
                        <p className="text-sm text-rf-textSoft mt-2 max-w-md mx-auto">
                            Run an ARDB catalog sync so{' '}
                            <code className="bg-white/5 px-1 rounded">/api/marketplace/catalog</code> includes blueprint
                            items that match the spreadsheet allowlist.
                        </p>
                    </div>
                )}

                {!catalogLoading && !catalogError && blueprints.length > 0 && (
                    <>
                        <div className="sticky top-16 z-40 print:hidden">
                            <div className="rf-card rounded-lg px-3 py-2.5 sm:px-4 border border-white/[0.08] bg-rf-bg/96 backdrop-blur-md shadow-md shadow-black/40">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-[0.18em] text-rf-textSoft font-semibold">
                                            Collection progress
                                        </p>
                                        <p className="text-base font-bold text-white tabular-nums mt-0.5">
                                            <span className="text-rf-green">{ownedCount}</span>
                                            <span className="text-rf-textSoft font-medium"> / </span>
                                            <span>{total}</span>
                                            <span className="text-rf-textSoft text-xs font-medium ml-1.5">({pct}%)</span>
                                        </p>
                                    </div>
                                    <div
                                        className="h-1.5 w-full sm:max-w-[14rem] rounded-full bg-black/40 border border-white/5 overflow-hidden"
                                        role="progressbar"
                                        aria-valuenow={ownedCount}
                                        aria-valuemin={0}
                                        aria-valuemax={total}
                                    >
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-rf-green/85 to-emerald-400/90 transition-[width] duration-500 ease-out"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {missingByTier.length > 0 && (
                            <div className="rf-card rounded-lg px-3 py-2.5 sm:px-4 border border-white/[0.06]">
                                <p className="text-[9px] uppercase tracking-[0.18em] text-rf-textSoft font-semibold mb-1.5">
                                    Missing by rarity
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {missingByTier.map(({ tier, label, items }) => (
                                        <span
                                            key={tier}
                                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${tierChipClass[tier]}`}
                                        >
                                            <span>{label}</span>
                                            <span className="tabular-nums opacity-90">{items.length}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="rf-card rounded-lg px-3 py-3 sm:px-4 border border-white/[0.06] space-y-3">
                            <div className="flex flex-col xl:flex-row xl:items-end gap-4 xl:justify-between">
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" className={btnExport} onClick={() => window.print()}>
                                        Print Missing to PDF
                                    </button>
                                    <button
                                        type="button"
                                        className={btnExport}
                                        disabled={jpegBusy || missingBlueprints.length === 0}
                                        onClick={handleExportJpeg}
                                    >
                                        {jpegBusy ? 'Exporting…' : 'Export Missing as JPEG'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.05] pt-3">
                                <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-rf-text">
                                    <input
                                        type="checkbox"
                                        checked={onlyMissing}
                                        onChange={(e) => setOnlyMissing(e.target.checked)}
                                        className="h-4 w-4 rounded border-white/25 bg-rf-bg/80 accent-rf-orange focus:ring-2 focus:ring-rf-red/35"
                                    />
                                    Show only missing
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-rf-text">
                                    <input
                                        type="checkbox"
                                        checked={quickToggleMode}
                                        onChange={(e) => setQuickToggleMode(e.target.checked)}
                                        className="h-4 w-4 rounded border-white/25 bg-rf-bg/80 accent-rf-blue focus:ring-2 focus:ring-rf-red/35"
                                    />
                                    Quick tap: tap card to toggle owned
                                </label>
                            </div>

                            <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:justify-between border-t border-white/[0.05] pt-3">
                                <div className="flex-1 min-w-0">
                                    <label
                                        htmlFor="bp-search"
                                        className="text-xs uppercase tracking-wider text-rf-textSoft block mb-1.5"
                                    >
                                        Search
                                    </label>
                                    <input
                                        id="bp-search"
                                        type="search"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Filter by name…"
                                        className="w-full rounded-lg bg-rf-bg/80 border border-white/10 px-3 py-2 text-sm text-rf-text placeholder:text-rf-textSoft/60 focus:outline-none focus:ring-2 focus:ring-rf-red/35 focus:border-rf-red/35"
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {foundInOptions.length > 0 && (
                                        <div className="sm:w-48">
                                            <label
                                                htmlFor="bp-foundin"
                                                className="text-xs uppercase tracking-wider text-rf-textSoft block mb-1.5"
                                            >
                                                Tag (found in)
                                            </label>
                                            <select
                                                id="bp-foundin"
                                                value={foundInFilter}
                                                onChange={(e) => setFoundInFilter(e.target.value)}
                                                className="w-full rounded-lg bg-rf-bg/80 border border-white/10 px-3 py-2 text-sm text-rf-text focus:outline-none focus:ring-2 focus:ring-rf-red/35"
                                            >
                                                <option value="__all__">All tags</option>
                                                {foundInOptions.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div className="sm:w-52">
                                        <label
                                            htmlFor="bp-sort"
                                            className="text-xs uppercase tracking-wider text-rf-textSoft block mb-1.5"
                                        >
                                            Sort
                                        </label>
                                        <select
                                            id="bp-sort"
                                            value={sortMode}
                                            onChange={(e) => setSortMode(e.target.value as SortMode)}
                                            className="w-full rounded-lg bg-rf-bg/80 border border-white/10 px-3 py-2 text-sm text-rf-text focus:outline-none focus:ring-2 focus:ring-rf-red/35"
                                        >
                                            {SORT_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-rf-textSoft border-t border-white/[0.05] pt-2.5">
                                <span>
                                    Showing <strong className="text-rf-text">{filtered.length}</strong> of{' '}
                                    <strong className="text-rf-text">{blueprints.length}</strong>
                                </span>
                                <span className="text-white/25 hidden sm:inline">|</span>
                                <span>
                                    Owned: <strong className="text-rf-green">{ownedCount}</strong>
                                </span>
                                <span>
                                    Missing: <strong className="text-rf-orange">{missingBlueprints.length}</strong>
                                </span>
                            </div>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="rf-card rounded-xl px-6 py-10 text-center text-rf-textSoft">
                                No blueprints match your filters.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-3.5 justify-items-stretch">
                                {filtered.map((b) => (
                                    <BlueprintCard
                                        key={b.id}
                                        blueprint={b}
                                        owned={trackMap[b.id] === 'owned'}
                                        onOwnedChange={(v) => setOwned(b.id, v)}
                                        quickToggleMode={quickToggleMode}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                <footer className="pt-6 pb-2 space-y-3 border-t border-white/[0.05] mt-6">
                    <p className="text-center text-[11px] text-rf-textSoft max-w-xl mx-auto leading-relaxed">
                        {ARDB_CATALOG_ATTRIBUTION.providerName} item metadata —{' '}
                        <Link href={ARDB_CATALOG_ATTRIBUTION.providerUrl} className="text-rf-blue hover:underline">
                            {ARDB_CATALOG_ATTRIBUTION.providerUrl.replace(/^https?:\/\//, '')}
                        </Link>
                        . {ARDB_CATALOG_ATTRIBUTION.disclaimer}
                    </p>
                    <p className="text-center text-[10px] text-rf-textSoft/65 leading-relaxed">
                        Tracker design inspiration courtesy of{' '}
                        <Link
                            href="https://speranzaintel.com/blueprint-tracker/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rf-textSoft/80 hover:text-rf-blue underline-offset-2 hover:underline transition-colors"
                        >
                            Speranza Intel
                        </Link>
                        .
                    </p>
                </footer>
            </div>

            {/* Print-only: missing blueprints grouped by rarity */}
            <div className="hidden print:block blueprints-print-sheet bg-white text-neutral-900 p-6">
                <header className="border-b border-neutral-300 pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-neutral-900">Missing Blueprints</h1>
                    <p className="text-sm text-neutral-600 mt-1">{missingBlueprints.length} items — RaiderForge</p>
                </header>
                {missingBlueprints.length === 0 ? (
                    <p className="text-sm text-neutral-600">
                        No missing blueprints — everything in the catalog is marked owned.
                    </p>
                ) : (
                    printGroups.map((group) => (
                        <section key={group.tier} className="mb-10 break-inside-avoid">
                            <h2 className="text-lg font-bold text-neutral-900 border-b-2 border-neutral-300 pb-2 mb-4">
                                {group.label}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {group.items.map((b) => {
                                    const img = resolveBlueprintImage(b)
                                    const desc = b.description?.trim()
                                    return (
                                        <div
                                            key={b.id}
                                            className="border border-neutral-200 rounded-xl p-4 break-inside-avoid"
                                        >
                                            <h3 className="font-semibold text-base text-neutral-900 leading-tight">
                                                {stripTrailingBlueprintSuffix(blueprintDisplayName(b))}
                                            </h3>
                                            {b.rarity ? (
                                                <p className="text-sm text-neutral-600 mt-1">
                                                    Rarity: {formatRarityLabel(b.rarity)}
                                                </p>
                                            ) : null}
                                            {desc ? (
                                                <p className="text-sm text-neutral-700 mt-2 leading-relaxed">{desc}</p>
                                            ) : null}
                                            {img ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={img}
                                                    alt=""
                                                    className="mt-3 h-28 w-auto max-w-full object-contain object-left"
                                                />
                                            ) : null}
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </div>
    )
}
