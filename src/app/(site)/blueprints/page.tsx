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
import { formatRarityLabel, type RarityVisualTier } from '@/lib/blueprints/rarityCardStyles'
import { applyBlueprintSort, type SortMode } from '@/lib/blueprints/sortBlueprints'
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

    const [query, setQuery] = useState('')
    const [foundInFilter, setFoundInFilter] = useState<string>('__all__')
    const [sortMode, setSortMode] = useState<SortMode>('rarity_desc')
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
            try {
                const res = await fetch('/api/marketplace/catalog', { cache: 'no-store' })
                if (!res.ok) throw new Error(`Catalog request failed (${res.status})`)
                const data = (await res.json()) as CatalogResponse
                if (!cancelled && Array.isArray(data.items)) {
                    setSyncedAt(data.syncedAt ?? null)
                    setBlueprints(blueprintsFromCatalogItems(data.items))
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
        if (q) list = list.filter((b) => b.name.toLowerCase().includes(q))
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
            items: [...g.items].sort((a, b) => a.name.localeCompare(b.name)),
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
            await exportMissingBlueprintsAsJpeg(missingBlueprints, 'rarity_desc')
        } catch {
            window.alert('Could not export JPEG. Try print to PDF, or check the browser console.')
        } finally {
            setJpegBusy(false)
        }
    }, [missingBlueprints])

    return (
        <div className="max-w-7xl mx-auto py-12 px-6">
            <div className="print:hidden space-y-8">
                <div className="rf-card rounded-2xl px-6 py-5">
                    <span className="text-xs uppercase tracking-widest text-rf-red font-semibold">Loadout</span>
                    <h1 className="mt-2 text-3xl font-bold text-white">Blueprint tracker</h1>
                    <p className="mt-3 text-rf-textSoft text-sm max-w-2xl">
                        Blueprints come from synced ARDB catalog rows where{' '}
                        <code className="text-rf-text/90 bg-white/5 px-1 rounded">{`itemType.trim().toLowerCase() === "blueprint"`}</code>
                        . No account needed — progress is saved locally on this device (this browser only).
                    </p>
                    {syncedAt && (
                        <p className="mt-2 text-xs text-rf-textSoft">
                            Catalog synced <time dateTime={syncedAt}>{new Date(syncedAt).toLocaleString()}</time>
                        </p>
                    )}
                </div>

                {catalogLoading && (
                    <div className="rf-card rounded-xl px-6 py-10 overflow-hidden" aria-busy="true">
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 bg-white/10 rounded-lg w-48" />
                            <div className="h-4 bg-white/[0.06] rounded w-full max-w-md" />
                            <div className="h-4 bg-white/[0.06] rounded w-full max-w-sm" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-4">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="rf-card rounded-2xl h-64 border border-white/5" />
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
                        <p className="text-rf-text font-medium">No blueprint rows in catalog</p>
                        <p className="text-sm text-rf-textSoft mt-2 max-w-md mx-auto">
                            Run an ARDB catalog sync so{' '}
                            <code className="bg-white/5 px-1 rounded">/api/marketplace/catalog</code> includes items.
                        </p>
                    </div>
                )}

                {!catalogLoading && !catalogError && blueprints.length > 0 && (
                    <>
                        <div className="sticky top-16 z-40 print:hidden">
                            <div className="rf-card rounded-xl px-4 py-3 border border-white/12 bg-rf-bg/95 backdrop-blur-md shadow-lg shadow-black/30">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-rf-textSoft font-semibold">
                                            Collection
                                        </p>
                                        <p className="text-lg font-bold text-white tabular-nums">
                                            You own{' '}
                                            <span className="text-rf-green">{ownedCount}</span>
                                            <span className="text-rf-textSoft font-medium"> / </span>
                                            <span>{total}</span>
                                            <span className="text-rf-textSoft text-sm font-medium ml-2">({pct}%)</span>
                                        </p>
                                    </div>
                                    <div
                                        className="h-2 w-full sm:max-w-xs rounded-full bg-white/10 overflow-hidden"
                                        role="progressbar"
                                        aria-valuenow={ownedCount}
                                        aria-valuemin={0}
                                        aria-valuemax={total}
                                    >
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-rf-green/80 to-emerald-400/90 transition-[width] duration-500 ease-out"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {missingByTier.length > 0 && (
                            <div className="rf-card rounded-xl px-4 py-3 border border-white/8">
                                <p className="text-[10px] uppercase tracking-widest text-rf-textSoft font-semibold mb-2">
                                    Missing by rarity
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {missingByTier.map(({ tier, label, items }) => (
                                        <span
                                            key={tier}
                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${tierChipClass[tier]}`}
                                        >
                                            <span>{label}</span>
                                            <span className="tabular-nums opacity-90">{items.length} missing</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="rf-card rounded-xl px-4 py-4 sm:px-5 space-y-4">
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

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/5 pt-4">
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

                            <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:justify-between border-t border-white/5 pt-4">
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

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-rf-textSoft border-t border-white/5 pt-3">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-stretch">
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

                <p className="text-center text-xs text-rf-textSoft max-w-xl mx-auto leading-relaxed pt-4">
                    {ARDB_CATALOG_ATTRIBUTION.providerName} item metadata —{' '}
                    <Link href={ARDB_CATALOG_ATTRIBUTION.providerUrl} className="text-rf-blue hover:underline">
                        {ARDB_CATALOG_ATTRIBUTION.providerUrl.replace(/^https?:\/\//, '')}
                    </Link>
                    . {ARDB_CATALOG_ATTRIBUTION.disclaimer}
                </p>
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
                                    const img = b.imageUrl ?? b.iconUrl
                                    const desc = b.description?.trim()
                                    return (
                                        <div
                                            key={b.id}
                                            className="border border-neutral-200 rounded-xl p-4 break-inside-avoid"
                                        >
                                            <h3 className="font-semibold text-base text-neutral-900 leading-tight">
                                                {b.name}
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
